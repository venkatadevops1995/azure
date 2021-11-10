from django.conf import settings
from .models import Employee, EmployeeMaster, EmployeeProfile, LeaveAccessGroup,PunchLogs
import traceback
import logging
import datetime
import os
import json
from django.db.models import Sum
# Modles
from .models import Employee,EmployeeProject,EmployeeWeeklyStatusTracker,EmployeeProjectTimeTracker,Project,Role,EmployeeWorkApproveStatus,MisInfo, StageEmployeeProject, EmailQueue,Leave, LocationHolidayCalendar
from .models import EmployeeHierarchy,EmployeeEntryCompStatus,EmployeeApprovalCompStatus,AttendanceAccessGroup,EmailAccessGroup,GlobalAccessFlag, ManagerWorkHistory, LeaveRequest, LeaveConfig, LeaveBalance

# Serialisers
from .serializers import EmployeeWorkApproveStatusSerializer,EmployeeApprovalCompStatusPostSerializer,EmployeeEntryCompStatusPostSerializer

from .serializers import EmployeeProjectTimeTrackerReqSerializer, EmployeeProjectTimeTrackerSerializer, WeeklyStatusReqSerializer, WeeklyStatusPostSerializer, EmployeeWorkApproveStatusPostSerializer,ManagerWorkHistoryPostSerializer
from .serializers import EmployeeManagerSerializer, PunchLogsSerializer
from vedikaweb.vedikaapi.services.email_service import email_service

from .constants import EmpStatus, LeaveDayStatus, StatusCode, ExcelHeadings, DefaultProjects, WorkApprovalStatuses, MailConfigurations, LeaveRequestStatus, LeaveMailTypes
from .utils import utils,StringOptimize
from .decorators import custom_exceptions,jwttokenvalidator, query_debugger
from django.db.models import Q,F,Count,Prefetch,CharField, Value as V
from datetime import datetime, timedelta, date
from vedikaweb.vedikaapi.views.common_views import CommonFunctions
from django.db.models.functions import Coalesce
from django.db.models.functions import Concat,ExtractYear
from django.db.models import Count
from django.template.loader import get_template,render_to_string
from django.core.mail import send_mail


log = logging.getLogger(__name__)

# 10 * * * *
def sentWelcomeEmail():
    log.info("Welcome email corn job.")

def employee_time_entry_complaince(prev_week=1):
    dayid,dayname=utils.findDay(datetime.now().date())
    if(dayid not in [2,6]):
        log.error("ENTRY COMPLAINCE CRONTAB RUNS ONLY ON SUNDAY AND WEDNESDAY")
        return
    weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(prev_week)))
    work_week=weekdatesList[-1].isocalendar()[1]
    year=str(weekdatesList[-1]).split('-')[0]
    employee_objs=Employee.objects.filter(status=1)
    work_approval_data=[]
    entry_complaince_data=[]
    c=CommonFunctions()
    complaince_cnt=0
    i=1
    for each in employee_objs:
        ## If the employee dont have wsrapproval data or it is in rejected state then it is employee_entry_complaince
        if(dayid==6):
            eas=EmployeeWorkApproveStatus.objects.select_related('emp').filter(Q(emp_id=each.emp_id) & Q(work_week=work_week) & ~Q(status=2) & Q(created__year=year))

        elif(dayid==2):
            eas=EmployeeWorkApproveStatus.objects.select_related('emp').filter(Q(emp_id=each.emp_id) & Q(work_week=work_week) & Q(status=2) & Q(created__year=year))

        
        if((len(eas)==0 and dayid==2) or (len(eas)>0 and dayid==6)):
            pass

        elif((len(eas)>0 and dayid==2) or (len(eas)==0 and dayid==6)):
            log.info("EMPLOYEE ID {} has not submitted the status for the week{}".format(each.emp_id,work_week))

            emp_proj_time_track=EmployeeProjectTimeTracker.objects.filter(employee_project__emp__emp_id=each.emp_id,work_week=work_week,created__year=year)
            emp_wsr=EmployeeWeeklyStatusTracker.objects.filter(employee_project__emp__emp_id=each.emp_id,wsr_week=work_week,created__year=year)
            weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(prev_week)))

            if(len(emp_proj_time_track)<=0):
                week_number=weekdatesList[-1].isocalendar()[1]
                work_hour_data=[]

                ##ADDING DUMMY DATA SHEETS IF THERE IS NO TIMESHEET##
                for eachdate in weekdatesList:
                    work_hour_data.append({'date':str(eachdate),'h':0,'m':0})
                proj=Project.objects.get(name=DefaultProjects.Test.value)
                time_sheet_data_dummy=[{'emp_id':each.emp_id,'emp_name':each.emp_name,'active_projects':[{'project_id':proj.id,'priority':0,'work_hours':work_hour_data}],DefaultProjects.Vacation.value:{'work_hours':work_hour_data},DefaultProjects.Mis.value:{'work_hours':work_hour_data}}]
                timetrack_req=c.get_post_request_for_timesheet(each.emp_id,time_sheet_data_dummy,prev_week=prev_week)
                emp_proj_ser=EmployeeProjectTimeTrackerSerializer(data=timetrack_req,many=True)
                if(emp_proj_ser.is_valid()):
                    emp_proj_ser.save()
                    log.info("Saving data for EmployeeId {} in EmployeeProjectTimetracker".format(each.emp_id))
                    
            if(len(emp_wsr)==0):
                ##ADDING DUMMY WSR DATA IF THERE IS NO WSR##
                proj=Project.objects.get(name=DefaultProjects.General.value)
                wsr_dummy_data={'wsr_date':str(weekdatesList[-1]),'weekly_status':[{'project_id':proj.id,'report':""}]}
                wsr_req=c.get_post_req_for_wsr(each.emp_id,wsr_dummy_data,prev_week=prev_week)
                wsr_post_serializer=WeeklyStatusPostSerializer(data=wsr_req,many=True)
                if(wsr_post_serializer.is_valid()):
                    wsr_post_serializer.save()
                    log.info("WSR ADDED FOR EMPID{}".format(each.emp_id))

            work_approval_data.append({'emp':each.emp_id,'work_week':work_week,'year':year,'status':WorkApprovalStatuses.EntryComplaince.value})
            entry_complaince_data.append({'emp':each.emp_id,'work_week':work_week,'year':year,'cnt':1,'weekdatesList':weekdatesList})
            complaince_cnt=complaince_cnt+1
        i=i+1
    final_nc_list = []
    final_work_approval_data = []
    for i,eachdata in enumerate(entry_complaince_data):
        vac_hol_list=[]
        l_ = Leave.objects.filter(leave_request__emp_id=eachdata['emp'],leave_on__in=eachdata['weekdatesList'],leave_request__status__in=[LeaveRequestStatus.Approved.value,LeaveRequestStatus.AutoApprovedEmp.value,LeaveRequestStatus.AutoApprovedMgr.value])
        if(len(l_)>=5):
            log.info("NO NC FOR EMP ID {} BEACUSE ALL WORKING DAYS ARE VACATION".format(eachdata['emp']))
            complaince_cnt=complaince_cnt-1
        else:
            vac_hol_list = list(map(lambda x:x.leave_on.date(),l_))
            holiday_obj = LocationHolidayCalendar.objects.getdetailedHolidayList(emp_id=eachdata['emp'])
            holiday_list = list(map(lambda x:x.holiday_date,holiday_obj))
            for each_holiday in holiday_list:
                for eachdate in eachdata['weekdatesList']:
                    if((eachdate==each_holiday) and (eachdate not in vac_hol_list)):
                        vac_hol_list.append(eachdate)
            if(len(vac_hol_list)>=5):
                log.info("NO NC FOR EMP ID {} BEACUSE ALL WORKING DAYS ARE VACATION/HOLIDAY".format(eachdata['emp']))
                complaince_cnt=complaince_cnt-1
            else:
                final_nc_list.append(eachdata)
                final_work_approval_data.append(work_approval_data[i])

    work_approval_serializer=EmployeeWorkApproveStatusPostSerializer(data=final_work_approval_data,many=True)
    if(work_approval_serializer.is_valid()):
        entry_comp_ser=EmployeeEntryCompStatusPostSerializer(data=final_nc_list,many=True)
        if(entry_comp_ser.is_valid()):
            work_approval_serializer.save()
            entry_comp_ser.save()
            log.info("COMPLAINCE UPDATED SUCCESSFULLY FOR {} Employees".format(complaince_cnt))
        else:
            log.error(entry_comp_ser.errors)
    else:
        log.error(work_approval_serializer.errors)
        

def update_total_time(prev_week=1):
    try:
        weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(prev_week)))
        work_week=weekdatesList[-1].isocalendar()[1]
        year=int(str(weekdatesList[-1]).split('-')[0])
        employee_objs=Employee.objects.filter(status=1)
        i=1
        for each in employee_objs:
            empproj_time_track = EmployeeProjectTimeTracker.objects.get_cumulative_of_week(emp_id=each.emp_id,work_week=work_week,year=year)
            for eachempproj in empproj_time_track:
                EmployeeProject.objects.filter(id=eachempproj['employee_project']).update(total_work_minutes=F('total_work_minutes')+eachempproj['sum_output_count'])

        log.info("Total Count updated for all employees successfully")
    except Exception as e:
        log.error(traceback.format_exc())

def manager_work_history_mapping(prev_week=1):
    try:
        weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(1)))
        work_week=weekdatesList[-1].isocalendar()[1]
        year=int(str(weekdatesList[-1]).split('-')[0])
        managers=Employee.objects.allmanagers()
        final_list=[]
        for each in managers:
            eh=EmployeeHierarchy.objects.direct_indirect_employees(manager_id=each.emp_id).values('emp_id').distinct()
            ehd=EmployeeHierarchy.objects.direct_managers(manager_id=each.emp_id).values('emp_id').distinct()
            entry_comp_cnt=0
            approval_comp_cnt=0
            total_work_minutes=0
            entry_comp_emp_list=[]
            approve_comp_emp_list=[]
            
            #For all Employees
            for eachemp in eh:
                entry_comp=EmployeeEntryCompStatus.objects.filter(Q(emp_id=eachemp['emp_id']) & Q(work_week=work_week) & Q(created__year=year)).aggregate(total_cnt=Coalesce(Sum('cnt'),0))
                if(entry_comp['total_cnt']>0):
                    entry_comp_emp_list.append(eachemp['emp_id'])
                empproj_time_track=EmployeeProjectTimeTracker.objects.get_cumulative_of_week_without_vacation_holiday(emp_id=eachemp['emp_id'],work_week=work_week,year=year)
                for eachproj in empproj_time_track:
                    total_work_minutes=total_work_minutes+int(eachproj['sum_output_count'])
                entry_comp_cnt=entry_comp_cnt+entry_comp['total_cnt']
                
            # For Functional & ManagersManagers
            for eachmanager in ehd:
                approval_comp=EmployeeApprovalCompStatus.objects.filter(Q(emp_id=eachmanager['emp_id']) & Q(work_week=work_week) & Q(created__year=year))
                if(len(approval_comp)>0 and eachmanager['emp_id']!=each.emp_id):
                    approve_comp_emp_list.append(eachmanager['emp_id'])
                    approval_comp_cnt=approval_comp_cnt+int(approval_comp[0].cnt)
                    
            approval_comp=EmployeeApprovalCompStatus.objects.filter(Q(emp_id=each.emp_id) & Q(work_week=work_week) & Q(created__year=year))
            if(len(approval_comp)>0):
                approve_comp_emp_list.append(each.emp_id)
                approval_comp_cnt=approval_comp_cnt+int(approval_comp[0].cnt)
            
            
            final_list.append({'emp':each.emp_id,'work_week':work_week,'entry_comp_cnt':entry_comp_cnt,'approval_comp_cnt':approval_comp_cnt,'emp_cnt':len(eh),'emp_list':str(list(map(lambda x:x['emp_id'],eh))),'entry_comp_list':str(entry_comp_emp_list),'approval_comp_list':str(approve_comp_emp_list),'total_work_minutes':total_work_minutes,'year':year})
        

        #print(json.dumps(final_list))
        manager_history_ser = ManagerWorkHistoryPostSerializer(data=final_list,many=True)
        if(manager_history_ser.is_valid()):
            manager_history_ser.save()
            log.info("MANAGER HISTORY DATA UPDATED SUCCESSFULLY FOR {} MANAGERS".format(len(final_list)))
        else:
            log.error(manager_history_ser.errors)
    except Exception as e:
        log.error(traceback.format_exc())

        

def employee_approval_complaince(prev_week=1):
    
    dayid,dayname=utils.findDay(datetime.now().date())
    if(dayid!=2):
        log.error("APPROVAL COMPLAINCE CRONTAB RUNS ONLY ON WEDNESDAY")
        return
    
    weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(prev_week)))
    work_week=weekdatesList[-1].isocalendar()[1]
    year=int(str(weekdatesList[-1]).split('-')[0])
    employee_objs=Employee.objects.filter(status=1)
    approval_complaince_data=[]
    approval_complaince_cnt=0
    i=1

    for each in employee_objs:
        # eas=EmployeeWorkApproveStatus.objects.filter(Q(emp_id=each.emp_id) & Q(work_week=work_week) & Q(status=2) & Q(created__year=year))
        eas=EmployeeWorkApproveStatus.objects.filter(Q(emp_id=each.emp_id) & Q(work_week=work_week) & (Q(status=0) | Q(status=3)) & Q(created__year=year))
        if(len(eas)==0):
            pass
        else:
            eh=EmployeeHierarchy.objects.filter(Q(emp_id=each.emp_id) & Q(priority=1))
            if(len(eh)==0):
                log.error("Employee Id {} has no P1 manager".format(str(each.emp_id)))
            else:
                approval_complaince_data.append({'emp':eh[0].manager_id,'work_week':work_week,'year':year,'cnt':1})
                approval_complaince_cnt=approval_complaince_cnt+1
        i=i+1
    
    ser=EmployeeApprovalCompStatusPostSerializer(data=approval_complaince_data,many=True)
    if(ser.is_valid()):
        ser.save()
        employee_time_entry_complaince(prev_week=prev_week)
        log.info("UPDATED APPROVAL COMPLAINCE FOR {} EMPLOYEES".format(approval_complaince_cnt))
        update_total_time(prev_week=prev_week)
        manager_work_history_mapping(prev_week=prev_week)
        
    else:
        log.error(ser.errors)

def sync_timetracker():

    last_emp_id = 0 # get last id from database default 0
    last_emp = EmployeeMaster.objects.using('attendance').order_by('-Id')[:1]
    if(len(last_emp) > 0 ):
        last_emp_id = last_emp[0].pk
    log.info("FETCHED LATEST EMPLOYEE FROM ID {}".format(last_emp_id))
    emp_data = EmployeeMaster.objects.using('timetracker').filter(pk__gt=last_emp_id)
    log.info("NUMBER OF NEW EMPLOYEES FETCHED FTOM TIMETRACKER {}".format(len(emp_data)))
    if(len(emp_data)>0):
        emp_serializer = EmployeeManagerSerializer(list(emp_data), many=True)
        emp_serializer.create(list(emp_serializer.data))
        log.info("NUMBER OF NEW EMPLOYEES INSERTED INTO ATTENDANCE {}".format(len(emp_data)))

    
    last_trans_id = 0 # get last id from database default 0
    last_trans = PunchLogs.objects.using('attendance').order_by('-TransID')[:1]
    if(len(last_trans) > 0 ):
        last_trans_id = last_trans[0].pk
    log.info("FETCHED LATEST LOGS FROM ID {}".format(last_trans_id))
    log_data = PunchLogs.objects.using('timetracker').filter(pk__gt=last_trans_id)
    log.info("NUMBER OF NEW LOGS FETCHED FROM TIMETRACKER {}".format(len(log_data)))
    if(len(log_data)> 0):
        log_serializer = PunchLogsSerializer(list(log_data), many=True)
        log_serializer.create(list(log_serializer.data))
        log.info("NUMBER OF NEW LOGS INSERTED INTO ATTENDANCE {}".format(len(log_data)))


# THIS CRON WILL RUNS ONLY ON FRIDAY AND SEND NOTIFICATION MAIL TO ALL EMPLOYEES
def EmployeeNotificationOne():
    dayid,dayname=utils.findDay(datetime.now().date())
    if(dayid!=4):
        log.error("THIS CRON WILL RUNS ONLY ON FRIDAY")
        return

    emp_obj = Employee.objects.prefetch_related('emp').filter(status=1)
    global_email_access = GlobalAccessFlag.objects.filter(status=1,access_type__iexact='EMAIL')
    individual_email_access_emps=[]
    if(len(global_email_access)>0):
        accessed_managers = list(map(lambda x:x.emp_id,emp_obj.filter(role_id=4)))
    else:
        accessed_managers = list(map(lambda x:x.emp_id,EmailAccessGroup.objects.filter(status=1)))
        individual_email_access_emps = list(map(lambda x:x.emp_id,EmailAccessGroup.objects.filter(status=2)))

    weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(0)))
    weeknumber=weekdatesList[-1].isocalendar()[1]
    template = get_template('emp.html')
    last5Weeks=[]
    
    for  i in range(1,6):
        n=weeknumber-i
        weekstart = list(utils.get_previous_week(datetime.now().date(),int(i)))[0]
        weekend = list(utils.get_previous_week(datetime.now().date(),int(i)))[-1] 
        week_year = str(weekend).split('-')[0]
        if(str(weekstart).split('-')[0] != str(weekend).split('-')[0]):
            week_year = str(weekstart).split('-')[0]
        
        if(n<=0):
            lastyear_last_week_=weekend.isocalendar()[1]
            n=lastyear_last_week_

        last5Weeks.append({'week':n,'year':week_year,"weekstart":weekstart.strftime('%b %d'),'weekend':weekend.strftime('%b %d')})
    
    for eachemp in emp_obj:
        try:
            managers_list=list(map(lambda x:x.manager_id,eachemp.emp.filter(status=1,priority=3)))
            if(any(item in accessed_managers for item in managers_list) or eachemp.emp_id in individual_email_access_emps):
                entry_complaince_statues=EmployeeEntryCompStatus.objects.filter(emp_id=eachemp.emp_id,work_week__in=[ sub['week'] for sub in last5Weeks ]).values().annotate(
                    cnt = Count('cnt'),
                    week_and_year = Concat(
                            'work_week', V('_'),ExtractYear('created'),
                            output_field=CharField()
                        )
                )
                resp=[]
                weekFound=False
                cnt=0
                
                for k,eachweek in enumerate(last5Weeks):
                    joinedWeek = eachemp.created.isocalendar()[1]
                    joinedYear = str(eachemp.created).split('-')[0]
                    validweek = False
                    
                    if(joinedWeek <= int(eachweek['week']) and int(joinedYear) <= int(eachweek['year'])):
                        validweek=True
                    
                    if(int(joinedYear) < int(eachweek['year'])):
                        if(joinedWeek > int(eachweek['week'])):
                            validweek=True
                    
                    for each_compliance in entry_complaince_statues:
                        if(each_compliance['week_and_year']==str(eachweek['week'])+"_"+str(eachweek['year'])):
                            weekFound=True
                            cnt=each_compliance['cnt']
                       
                    if(weekFound):
                        resp.append({"week":eachweek['week'],'year':eachweek['year'],"cnt":cnt,"valid":validweek,'weekstart':eachweek['weekstart'],'weekend':eachweek['weekend']}) 
                    else:
                        resp.append({"week":eachweek['week'],'year':eachweek['year'],"cnt":cnt,"valid":validweek,'weekstart':eachweek['weekstart'],'weekend':eachweek['weekend']})
                    
                
                    weekFound=False
                    validweek=False
                    cnt=0
                
                ctx={
                    "data":resp,
                    "name":eachemp.emp_name,
                    "UI_URL":settings.UI_URL
                }
                mail_content = template.render(ctx)
                emailList = [eachemp.email]
                try:
                    
                    if(settings.SENDEMAILTOALL):
                        ret_val = send_mail(MailConfigurations.RemainderSubject.value, mail_content, settings.EMAIL_FROM, emailList, html_message=mail_content)
                        log.info("MAIL SENT TO {}".format(emailList))
                        
                    else:
                        if(eachemp.email in settings.CUSTOM_EMAILS):
                            ret_val = send_mail(MailConfigurations.RemainderSubject.value, mail_content, settings.EMAIL_FROM, emailList, html_message=mail_content)
                            
                            log.info("MAIL SENT TO {}".format(emailList))
                except Exception as e:
                    log.error(traceback.format_exc())
        except Exception as e:
            log.error("Failed to Send mail to ",eachemp.emp_id)
            log.error(traceback.format_exc())

#THIS CRON WILL RUNS ONLY ON TUESDAY AND IT WILL SEND REMAINDER MAIL TO THE MANAGER FOR THE TIMESHEETS APPROVALS
def ManagerNotificationThree():
    dayid,dayname=utils.findDay(datetime.now().date())
    if(dayid!=1):
        log.error("THIS CRON WILL RUNS ONLY ON TUESDAY")
        return

    emp_obj = Employee.objects.prefetch_related('emp').filter(status=1,role_id__gt=1)
    global_email_access = GlobalAccessFlag.objects.filter(status=1,access_type__iexact='EMAIL')
    individual_email_access_emps = []
    if(len(global_email_access)>0):
        accessed_managers = list(map(lambda x:x.emp_id,emp_obj))
        
    else:
        accessed_managers = list(map(lambda x:x.emp_id,EmailAccessGroup.objects.filter(status=1)))
        individual_email_access_emps = list(map(lambda x:x.emp_id,EmailAccessGroup.objects.filter(status=2)))
    # emp_obj = AttendanceAccessGroup.objects.select_related('emp').filter(status=1)
    weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(0)))
    weeknumber=weekdatesList[-1].isocalendar()[1]
    template = get_template('manager.html')
    last5Weeks=[]
    for  i in range(2,7):
        n=weeknumber-i
        weekstart = list(utils.get_previous_week(datetime.now().date(),int(i)))[0]
        weekend = list(utils.get_previous_week(datetime.now().date(),int(i)))[-1]
        week_year = str(weekend).split('-')[0]

        if(str(weekstart).split('-')[0] != str(weekend).split('-')[0]):
            week_year = str(weekstart).split('-')[0]

        if(n<=0):
            lastyear_last_week_=weekend.isocalendar()[1]      
            n=lastyear_last_week_
        last5Weeks.append({'week':n,'year':week_year,'weekstart':weekstart.strftime('%b %d'),'weekend':weekend.strftime('%b %d')})
    
    for count,eachemp in enumerate(emp_obj):
        try:
            managers_list=list(map(lambda x:x.manager_id,eachemp.emp.filter(status=1,priority=3)))
            if(any(item in accessed_managers for item in managers_list) or eachemp.emp_id in individual_email_access_emps):
                manager_history_obj = EmployeeApprovalCompStatus.objects.filter(emp_id=eachemp.emp_id,emp__status=1,work_week__in=[ sub['week'] for sub in last5Weeks ]).values().annotate(
                    approval_comp_cnt = F('cnt'),
                    week_and_year = Concat(
                            'work_week', V('_'),ExtractYear('created'),
                            output_field=CharField()
                        )
                )
                # manager_history_obj = ManagerWorkHistory.objects.filter(emp_id=eachemp.emp_id,emp__status=1,work_week__in=[ sub['week'] for sub in last5Weeks ]).values().annotate(
                #     cnt = Count('approval_comp_cnt'),
                #     week_and_year = Concat(
                #             'work_week', V('_'),ExtractYear('created'),
                #             output_field=CharField()
                #         )
                # )
                resp=[]
                weekFound=False
                cnt=0
                for k,eachweek in enumerate(last5Weeks):
                    joinedWeek = eachemp.created.isocalendar()[1]
                    joinedYear = str(eachemp.created).split('-')[0]
                    validweek = False
                    if(joinedWeek <= int(eachweek['week']) and int(joinedYear) <= int(eachweek['year'])):
                        validweek=True
                    
                    if(int(joinedYear) < int(eachweek['year'])):
                        if(joinedWeek > int(eachweek['week'])):
                            validweek=True

                    for each_compliance in manager_history_obj:
                        if(each_compliance['week_and_year']==str(eachweek['week'])+"_"+str(eachweek['year'])):
                            weekFound=True
                            cnt=each_compliance['approval_comp_cnt']

                    if(weekFound):
                        resp.append({"week":eachweek['week'],"year":eachweek['year'],"cnt":cnt,"valid":validweek,'weekstart':eachweek['weekstart'],'weekend':eachweek['weekend']})
                        weekFound=False
                        cnt=0
                    else:
                        resp.append({"week":eachweek['week'],"year":eachweek['year'],"cnt":cnt,"valid":validweek,'weekstart':eachweek['weekstart'],'weekend':eachweek['weekend']})
                ctx={
                    "data":resp,
                    "name":eachemp.emp_name,
                    "UI_URL":settings.UI_URL
                }
                mail_content    = template.render(ctx)
                emailList = [eachemp.email]
                try:
                    if(settings.SENDEMAILTOALL):
                        ret_val = send_mail(MailConfigurations.RemainderSubject.value, mail_content, settings.EMAIL_FROM, emailList, html_message=mail_content)
                        log.info("MAIL SEND TO MANAGERS {}".format(emailList))
                    else:
                        if(eachemp.email in settings.CUSTOM_EMAILS):
                            ret_val = send_mail(MailConfigurations.RemainderSubject.value, mail_content, settings.EMAIL_FROM, emailList, html_message=mail_content)
                            log.info("MAIL SEND TO MANAGERS {}".format(emailList))
                    
                except Exception as e:
                    log.error(traceback.format_exc())
        except Exception as e:
            log.error("Failed to Send mail to ",eachemp.emp_id)
            log.error(traceback.format_exc())


#THIS CRON RUNS ONLY ON SATURDAY AND IT WILL SEND SECOND REMAINDER MAIL TO THE EMPLOYEES THOSE WHO ARE NOT SUBMITTED.
def EmployeeNotificationTwo():
    dayid,dayname=utils.findDay(datetime.now().date())
    if(dayid!=5):
        log.error("THIS CRON RUNS ONLY ON SATURDAY")
        return
    emp_obj = Employee.objects.prefetch_related('emp').filter(status=1)
    emp_list = list(map(lambda x:x.emp_id,emp_obj))
    global_email_access = GlobalAccessFlag.objects.filter(status=1,access_type__iexact='EMAIL')
    individual_email_access_emps=[]
    if(len(global_email_access)>0):
        accessed_managers = list(map(lambda x:x.emp_id,Employee.objects.filter(role_id=4,status=1)))
    else:
        accessed_managers = list(map(lambda x:x.emp_id,EmailAccessGroup.objects.filter(status=1)))
        individual_email_access_emps = list(map(lambda x:x.emp_id,EmailAccessGroup.objects.filter(status=2)))
    weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(0)))
    weeknumber=weekdatesList[-1].isocalendar()[1]
    weekyear = str(weekdatesList[-1]).split('-')[0]

    ###TO GET EMPLOYEES WHO HAS SUBMITTED THIS WEEK TIME SHEET####
    
    time_submitted_employees_obj = EmployeeWorkApproveStatus.objects.filter(Q(work_week=weeknumber) & Q(created__year=weekyear)).values('emp_id')

    
    time_submitted_employees_list = list(map(lambda x:x['emp_id'],time_submitted_employees_obj))
    ###################################################################
    
    # print(time_submitted_employees_list)

    template = get_template('emp_saturday.html')
    last5Weeks=[]
    
    for  i in range(1,6):
        n=weeknumber-i
        weekstart = list(utils.get_previous_week(datetime.now().date(),int(i)))[0]
        weekend = list(utils.get_previous_week(datetime.now().date(),int(i)))[-1] 
        week_year = str(weekend).split('-')[0]

        if(str(weekstart).split('-')[0] != str(weekend).split('-')[0]):
            week_year = str(weekstart).split('-')[0]
            
        if(n<=0):
            lastyear_last_week_=weekend.isocalendar()[1]
            n=lastyear_last_week_

        last5Weeks.append({'week':n,'year':week_year,"weekstart":weekstart.strftime('%b %d'),'weekend':weekend.strftime('%b %d')})
        
        
    for eachemp in emp_obj:
        try:
            if(eachemp.emp_id not in time_submitted_employees_list):
                managers_list=list(map(lambda x:x.manager_id,eachemp.emp.filter(status=1,priority=3)))
                if(any(item in accessed_managers for item in managers_list) or eachemp.emp_id in individual_email_access_emps):
                    entry_complaince_statues=EmployeeEntryCompStatus.objects.filter(emp_id=eachemp.emp_id,work_week__in=[ sub['week'] for sub in last5Weeks ]).values().annotate(
                        cnt = Count('cnt'),
                        week_and_year = Concat(
                                'work_week', V('_'),ExtractYear('created'),
                                output_field=CharField()
                            )
                    )
                    resp=[]
                    weekFound=False
                    cnt=0
                    
                    for k,eachweek in enumerate(last5Weeks):
                        joinedWeek = eachemp.created.isocalendar()[1]
                        joinedYear = str(eachemp.created).split('-')[0]
                        validweek = False
                        
                        if(joinedWeek <= int(eachweek['week']) and int(joinedYear) <= int(eachweek['year'])):
                            validweek=True
                        
                        if(int(joinedYear) < int(eachweek['year'])):
                            if(joinedWeek > int(eachweek['week'])):
                                validweek=True

                        for each_compliance in entry_complaince_statues:
                            if(each_compliance['week_and_year']==str(eachweek['week'])+"_"+str(eachweek['year'])):
                                weekFound=True
                                cnt=each_compliance['cnt']

                        if(weekFound):
                            resp.append({"week":eachweek['week'],'year':eachweek['year'],"cnt":cnt,"valid":validweek,'weekstart':eachweek['weekstart'],'weekend':eachweek['weekend']}) 
                        else:
                            resp.append({"week":eachweek['week'],'year':eachweek['year'],"cnt":cnt,"valid":validweek,'weekstart':eachweek['weekstart'],'weekend':eachweek['weekend']})
                        
                    
                        weekFound=False
                        validweek=False
                        cnt=0
                        
                    ctx={
                        "data":resp,
                        "name":eachemp.emp_name,
                        "UI_URL":settings.UI_URL
                    }
                    mail_content = template.render(ctx)
                    emailList = [eachemp.email]
                    try:
                        
                        if(settings.SENDEMAILTOALL):
                            ret_val = send_mail(MailConfigurations.RemainderSubject.value, mail_content, settings.EMAIL_FROM, emailList, html_message=mail_content)
                            log.info("MAIL SENT TO {}".format(emailList))
                            
                        else:
                            
                            if(eachemp.email in settings.CUSTOM_EMAILS):
                                ret_val = send_mail(MailConfigurations.RemainderSubject.value, mail_content, settings.EMAIL_FROM, emailList, html_message=mail_content)
                                log.info("MAIL SENT TO {}".format(emailList))
                    except Exception as e:
                        log.error(traceback.format_exc())
            else:
                # log.info("{} has submitted times".format(eachemp.emp_name))
                pass

        except Exception as e:
            log.error("Failed to Send mail to ",eachemp.emp_id)
            log.error(traceback.format_exc())

#THIS CRON WILL RUN ONLY ON SATURDAY/SUNDAY. SATURDAY IT WILL SEND THE LIST OF EMPLOYEES LIST WHO HAS NOT SUBMITTED WORK STATUS BEFORE SATURDAY. SUNDAY IT WILL SEND THE LIST OF EMPLOYEES LIST WHO HAS NC's FOR THAT WEEK
def ManagerNotificationOneTwo():
    dayid,dayname=utils.findDay(datetime.now().date())
    if(dayid not in [5,6]):
        log.error("THIS CRON WILL RUN ONLY ON SATURDAY/SUNDAY")
        return

    emp_obj = Employee.objects.prefetch_related('emp').filter(status=1,role_id__gt=1)
    global_email_access = GlobalAccessFlag.objects.filter(status=1,access_type__iexact='EMAIL')
    individual_email_access_emps=[]
    if(len(global_email_access)>0):
        accessed_managers = list(map(lambda x:x.emp_id,emp_obj))
        
    else:
        accessed_managers = list(map(lambda x:x.emp_id,EmailAccessGroup.objects.filter(status=1)))
        individual_email_access_emps = list(map(lambda x:x.emp_id,EmailAccessGroup.objects.filter(status=2)))

    # emp_obj = AttendanceAccessGroup.objects.select_related('emp').filter(status=1)
    weekdatesList=list(utils.get_previous_week(datetime.now().date(),int(0)))
    weeknumber=weekdatesList[-1].isocalendar()[1]
    weekyear = str(weekdatesList[-1]).split('-')[0]
    template = get_template('manager_saturday.html')
    last5Weeks=[]


    ###TO GET EMPLOYEES WHO HAS SUBMITTED PREVIOUS WEEK TIME SHEET####
    previous_weekdatesList = list(utils.get_previous_week(datetime.now().date(),int(1)))
    previous_weeknumber = previous_weekdatesList[-1].isocalendar()[1]
    previous_week_year = str(previous_weekdatesList[-1]).split('-')[0]

    if(dayid==5):
        time_submitted_employees_obj = EmployeeWorkApproveStatus.objects.filter(Q(work_week=weeknumber) & Q(created__year=weekyear)).values('emp_id')
        condition = lambda emp,list_emp: True if emp not in list_emp else False
        
    if(dayid==6):
        time_submitted_employees_obj = EmployeeWorkApproveStatus.objects.filter(Q(work_week=previous_weeknumber) & Q(created__year=previous_week_year) & Q(status=3)).values('emp_id')
        condition = lambda emp,list_emp: True if emp in list_emp else False

    time_submitted_employees_list = list(map(lambda x:x['emp_id'],time_submitted_employees_obj))
    ###################################################################

    for  i in range(1,6):
        n=weeknumber-i
        weekstart = list(utils.get_previous_week(datetime.now().date(),int(i)))[0]
        weekend = list(utils.get_previous_week(datetime.now().date(),int(i)))[-1]
        week_year = str(weekend).split('-')[0]
        if(str(weekstart).split('-')[0] != str(weekend).split('-')[0]):
            week_year = str(weekstart).split('-')[0]

        if(n<=0):
            lastyear_last_week_=weekend.isocalendar()[1]      
            n=lastyear_last_week_
        last5Weeks.append({'week':n,'year':week_year,'weekstart':weekstart.strftime('%b %d'),'weekend':weekend.strftime('%b %d')})
    
    for count,eachemp in enumerate(emp_obj):
        try:
            
            managers_list=list(map(lambda x:x.manager_id,eachemp.emp.filter(status=1,priority=3)))
            if(any(item in accessed_managers for item in managers_list) or eachemp.emp_id in individual_email_access_emps):
                employees_under_manager_obj=EmployeeHierarchy.objects.directemployees(manager_id=eachemp.emp_id)
                employees_under_manager_list=list(map(lambda  x: {"emp_id":x.emp_id,"name":x.emp.emp_name,"staff_no":x.emp.staff_no,'created':x.emp.created},employees_under_manager_obj))
                
                not_submitted_employees = [{"name":each_employee['name'],"staff_no":each_employee['staff_no'],'created':each_employee['created'],"emp_id":each_employee['emp_id']} for each_employee in employees_under_manager_list if condition(each_employee['emp_id'],time_submitted_employees_list)]



                
                resp_comp=[]
                weekFound=False
                cnt=0
                # for each_emp_comp in entry_complaince_statues:
                emp_count = 1
                for each_emp in not_submitted_employees:
                    
                    resp = []
                    each_emp_comp = []
                    entry_complaince_statues=EmployeeEntryCompStatus.objects.filter(emp_id=each_emp['emp_id'],work_week__in=[ sub['week'] for sub in last5Weeks ]).values().annotate(
                        cnt = Count('cnt'),
                        week_and_year = Concat(
                                'work_week', V('_'),ExtractYear('created'),
                                output_field=CharField()
                            ),
                        emp_created = F('emp__created'),
                        name = F('emp__emp_name'),
                        staff_no = F('emp__staff_no')
                    )
                    if(len(entry_complaince_statues)>0):
                        each_emp_comp = entry_complaince_statues[0]
                    else:
                        each_emp_comp = {'emp_created':each_emp['created'],'name':each_emp['name'],'staff_no':each_emp['staff_no']}
                    




                    for k,eachweek in enumerate(last5Weeks):
                        joinedWeek = each_emp_comp['emp_created'].isocalendar()[1]
                        joinedYear = str(each_emp_comp['emp_created']).split('-')[0]
                        validweek = False
                        
                        if(joinedWeek <= int(eachweek['week']) and int(joinedYear) <= int(eachweek['year'])):
                            validweek=True
                        
                        if(int(joinedYear) < int(eachweek['year'])):
                            if(joinedWeek > int(eachweek['week'])):
                                validweek=True

                        for each_compliance in entry_complaince_statues:
                            
                            if(each_compliance['week_and_year']==str(eachweek['week'])+"_"+str(eachweek['year'])):
                                weekFound=True
                                cnt=each_compliance['cnt']
                        if(weekFound):
                            resp.append({"week":eachweek['week'],'year':eachweek['year'],"cnt":cnt,"valid":validweek,'weekstart':eachweek['weekstart'],'weekend':eachweek['weekend']}) 
                        else:
                            resp.append({"week":eachweek['week'],'year':eachweek['year'],"cnt":cnt,"valid":validweek,'weekstart':eachweek['weekstart'],'weekend':eachweek['weekend']})
                    
                    
                        weekFound=False
                        validweek=False
                        cnt=0
                    resp_comp.append({'index':emp_count,'name':each_emp_comp['name'],'staff_no':each_emp_comp['staff_no'],'comp':resp})
                    emp_count = emp_count + 1
                    

                ctx={
                    "data":resp_comp,
                    "name":eachemp.emp_name,
                    "UI_URL":settings.UI_URL
                }
                mail_content    = template.render(ctx)
                emailList = [eachemp.email]
                try:
                    if(len(not_submitted_employees)>0):
                        if(settings.SENDEMAILTOALL):
                            ret_val = send_mail(MailConfigurations.RemainderSubject.value, mail_content, settings.EMAIL_FROM, emailList, html_message=mail_content)
                            log.info("MAIL SEND TO MANAGERS {}".format(emailList))
                        else:
                            if(eachemp.email in settings.CUSTOM_EMAILS):
                                ret_val = send_mail(MailConfigurations.RemainderSubject.value, mail_content, settings.EMAIL_FROM, emailList, html_message=mail_content)
                                log.info("MAIL SEND TO MANAGERS {}".format(emailList))
                    else:
                        log.info("ALL EMPLOYEES UNDER {} ARE SUBMITTED WORK STATUS".format(emailList))
                    
                except Exception as e:
                    log.error(traceback.format_exc())
        except Exception as e:
            log.error("Failed to Send mail to ",eachemp.emp_id)
            log.error(traceback.format_exc())

def ModifyProjectsCron():
    dayid,dayname=utils.findDay(datetime.now().date())
    # if(dayid not in [6]):
    #     log.error("THIS CRON WILL RUN ONLY ON SUNDAY")
    #     return

    stage_data = StageEmployeeProject.objects.filter(status =1)
    # fetching all the unique employees
    modify_emp_list = set(map(lambda x: x.emp_id,stage_data))
    

    for emp_id in modify_emp_list:
        stage_projects_data = stage_data.filter(emp_id = emp_id ).order_by('priority')
        # getting the existing activated projects
        existing_dict = EmployeeProject.objects.filter(Q(emp_id = emp_id),~Q(project__name__in = DefaultProjects.list())).order_by('priority')
        # putting existed projects into deleted list those are already there in staged table with same project id or same priotiry 
        deleted_list = existing_dict.filter(~Q(project_id__in=[ex.project_id for ex in stage_projects_data]),Q(priority__in=[ex.priority for ex in stage_projects_data]),Q(status=1))
        deleted_list_id = list(map(lambda x:[x.project_id,x.priority],deleted_list))
        for i in range(0,len(stage_projects_data)):
            # disabling the existing projects that has the same priority as those in the staged table with project 0
            if(stage_projects_data[i].project_id == 0):
                existing_dict.filter(emp_id = emp_id,priority=stage_projects_data[i].priority).update(status=0,priority=0)
                # deleted_list.update(status=0)
                log.info("Deleted projects for employee_id:{} priority:{}".format(emp_id,stage_projects_data[i].priority))
            else:
                existing_proj = existing_dict.filter(project_id=stage_projects_data[i].project_id)
            
                if(len(existing_proj)>0):
                    existing_proj.update(priority = stage_projects_data[i].priority,status=1)
                    log.info("priority has been changed for employee_id:{} project_id:{} priority:{}".format(emp_id,stage_projects_data[i].project_id,stage_projects_data[i].priority))
                else:
                    EmployeeProject(status =1,emp_id = emp_id,project_id=stage_projects_data[i].project_id,priority= stage_projects_data[i].priority).save()
                    log.info("Project has been added for employee_id:{} project_id:{} priority:{}".format(emp_id,stage_projects_data[i].project_id,stage_projects_data[i].priority))
        if(len(deleted_list)>0):
            deleted_list.update(status=0,priority=0)
            for each_dlt_prj in deleted_list_id:
                log.info("Deleted projects employee_id:{} project_id:{} priority:0 ".format(emp_id,each_dlt_prj[0]))
    stage_data.update(status = 0)

        

def LeaveUpdateCron():
    # This cron should run on the first of every month
    if datetime.today().date().day == 1: 
        # for all the employees as per the config add the leave credits into the leave_balance table. Find new hires based on the date_of_join and credit leaves to them based on the new hire config.
        # get the leave config for different employee types and Paid leave type and create a list with index equal to the employee type id and value equal to the max_leaves
        leave_credits = []
        leave_config = LeaveConfig.objects.filter(leave_type=1).order_by('category').values('category','max_leaves')
        # print(leave_config)
        leave_config_values = dict()
        for config in leave_config:
            leave_config_values[config['category']] = config['max_leaves']
        # get all the employees using the Employee model and also prefetch the EmployeeProfile objects using prefetch_related in order to have the employee type
        employees = EmployeeProfile.objects.filter(emp_id__status = 1,emp__emp__priority=3).annotate(
            functional_manager = F('emp__emp__manager_id')
        )
        # loop through all the employees and based on the employee type (category) add the leave credits while creating the leave balance objects
        maternal_leave_obj = Leave.objects.filter(leave_on__date=datetime.today().date(),leave_request__leave_type__name__iexact='Maternity',leave_request__status__in=[LeaveRequestStatus.Pending.value,LeaveRequestStatus.Approved.value,LeaveRequestStatus.AutoApprovedEmp.value,LeaveRequestStatus.AutoApprovedMgr.value]).annotate(
            emp_id = F('leave_request__emp__emp_id')
        ).values_list('emp_id',flat=True)
        emp_obj = Employee.objects.prefetch_related('emp').filter(status=1,role_id__gt=1)
        global_email_access = GlobalAccessFlag.objects.filter(status=1,access_type__iexact='LEAVE')
        if(len(global_email_access)>0):
            leave_access_managers_list = list(map(lambda x:x.emp_id,emp_obj))
        else:
            leave_access_managers_obj = LeaveAccessGroup.objects.filter(status=1)
            leave_access_individual_obj = LeaveAccessGroup.objects.filter(status=2)
            leave_access_managers_list = list(map(lambda x:x.emp_id,leave_access_managers_obj))
            leave_access_individual_list = list(map(lambda x:x.emp_id, leave_access_individual_obj))
        maternal_leave_emps_list = list(maternal_leave_obj)
        for employee in employees:
            if((employee.functional_manager in leave_access_managers_list) or (employee.emp.emp_id in leave_access_individual_list)):
                emp_id = employee.emp
                if(emp_id.emp_id not in maternal_leave_emps_list):
                    category = employee.category
                    leave_balance = LeaveBalance(
                        emp = emp_id,
                        year = datetime.today().date().year,
                        month = datetime.today().date().month,
                        leave_credits = leave_config_values[category.id],
                        acted_by = 1,        #(1:'cron', 2:'hr')
                        created = datetime.now(),
                        comments = "monthly leave credit with cron job",
                        hr_emp_id=0,
                        status=1
                    )
                    leave_credits.append(leave_balance)
            else:
                log.info("Employee Id {} not have access for the leaves".format(employee.emp_id))
        # bulk create the leave balance db rows for all the employees by adding them into an array while looping above
        LeaveBalance.objects.bulk_create(leave_credits,100)
    else:
        log.error("THIS CRON WILL RUN ONLY ON 1st DAY OF EVERY MONTH")
          

def autoApprovalOfExpiredLeaveRequests():
    today = datetime.today()
    today = today.replace(hour=0, minute=0, second=0, microsecond=0)
    expired_leave_req = LeaveRequest.objects.prefetch_related('leave_set').filter(status=LeaveRequestStatus.Pending.value,startdate__custom_lte=today)
    for each_req in expired_leave_req:
        each_req.leave_set.filter().update(status=LeaveDayStatus.Consumed.value)
        each_req.status=LeaveRequestStatus.AutoApprovedMgr.value
        each_req.save()
        email_service.sendLeaveMail(each_req.id,LeaveMailTypes.AutoApprovedMgr.value)
    # expired_leave_req.update(status=LeaveRequestStatus.AutoApprovedMgr.value)

def emailCron():
    get_queue_data = EmailQueue.objects.filter(status=0)
    list_d = list(get_queue_data)
    if(len(get_queue_data)>0):
        get_queue_data.update(status=1)
        for each in list_d:
            template_name = each.email_type
            template = get_template(template_name+'.html')
            mail_content = template.render(json.loads(each.required_inputs))
            try:
                ret_val = send_mail(each.email_subject, mail_content, settings.EMAIL_FROM, [each.email], html_message=mail_content)
                if(ret_val==1):
                    each.status=2
                    each.save()
                    log.info("Success - "+str(template_name)+" Mail Send to  emp-id:{}':{}".format(each.emp_id, each.email))
                else:
                    each.status=3
                    each.save()
                    log.info("Failed - "+str(template_name)+" Mail Send to  emp-id:{}':{}".format(each.emp_id, each.email))
            except Exception as e:
                each.status=3
                each.save()
                log.error(traceback.format_exc())        
    else:
        log.info("No pending emails to sent")