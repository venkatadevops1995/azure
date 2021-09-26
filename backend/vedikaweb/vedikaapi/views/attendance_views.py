from rest_framework.views import APIView
from rest_framework.response import Response

# Modles
from vedikaweb.vedikaapi.models import Employee,EmployeeHierarchy, AttendanceAccessGroup, GlobalAccessFlag


from vedikaweb.vedikaapi.constants import StatusCode
from vedikaweb.vedikaapi.utils import utils
from vedikaweb.vedikaapi.decorators import custom_exceptions,jwttokenvalidator
from vedikaweb.vedikaapi.services.xlsxservice import ExcelServices

import logging
from vedikaweb.vedikaapi.services.attendance_serices import AttendenceService as attendance
from django.utils import timezone
from django.db.models import When, Case, Value as V
log = logging.getLogger(__name__)

attendance_ = attendance()


class AttendanceApi(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request):
        from_date = self.request.query_params.get('from', timezone.now())
        to_date = self.request.query_params.get('to', timezone.now())
        downloadFlag = self.request.query_params.get('download', False)
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        # emp_id=auth_details['emp_id']
        emp_id = self.request.query_params.get('emp_id', None)
        if emp_id == None:
            emp_id=auth_details['emp_id']
        empid=auth_details['emp_id']
        attendance_for_all = self.request.query_params.get('all_emp', False)
        # final_datastructure,attendance_flag,present_dates_list=attendance_.get_tt_final_datastructure(emp_id,from_date,to_date)
        final_dict = {'final_datastructure': [],'attendance_flag':[],'present_dates_list':[]}

        if not attendance_for_all:
            final_datastructure,attendance_flag,present_dates_list=attendance_.get_tt_final_datastructure(emp_id,from_date,to_date)
            final_dict['final_datastructure'].append(final_datastructure)
            final_dict['attendance_flag'].append(attendance_flag)
            final_dict['present_dates_list'].append(present_dates_list)
        else:
            direct_and_indirect_repoters_details = EmployeeHierarchy.objects.filter(manager_id = emp_id, emp__status=1).values('emp_id').distinct()
            
            # get data of user itself, if user is NOT a reporting manager of himself/herself.
            if emp_id not in [eachereporter['emp_id']for eachereporter in direct_and_indirect_repoters_details]:
                final_datastructure,attendance_flag,present_dates_list=attendance_.get_tt_final_datastructure(emp_id,from_date,to_date)
                final_dict['final_datastructure'].append(final_datastructure)
                final_dict['attendance_flag'].append(attendance_flag)
                final_dict['present_dates_list'].append(present_dates_list)
            # get data of all direct and indirect employee under user.
            for eachereporter in direct_and_indirect_repoters_details:
                emp_id = eachereporter['emp_id']
                final_datastructure,attendance_flag,present_dates_list=attendance_.get_tt_final_datastructure(emp_id,from_date,to_date)
                final_dict['final_datastructure'].append(final_datastructure)
                final_dict['attendance_flag'].append(attendance_flag)
                final_dict['present_dates_list'].append(present_dates_list)
        if(not downloadFlag):
            if attendance_for_all:
                return Response(utils.StyleRes(message='success',results={"downloadable":True}), status=StatusCode.HTTP_OK)
            else:
                return Response(utils.StyleRes(message='success',results=reversed(final_dict['final_datastructure'][0])), status=StatusCode.HTTP_OK)
        elif downloadFlag and attendance_for_all:
            emp_name = Employee.objects.filter(emp_id=empid)[0].emp_name
            basename=''+emp_name+"_Team_Attendance_"+str(from_date)+'_'+str(to_date)+'.xlsx'
            response=utils.contentTypesResponce('xl',basename)
            e=ExcelServices(response,in_memory=True,workSheetName="Attendance Report",cell_format={'font_size': 10,'font_name':'Arial','align':'left'})
            columns=['Staff No','Name','Date','FirstInTime','LastOutTime','Gross Working Hours','Net Working Hours', 'Timesheet Posted Hours']
            data=[columns]

            for each_data in final_dict['final_datastructure']:
                for each in each_data:
                    data.append([each['staff_no'],each['emp_name'],each['Date'],each['FirstInTime'],each['LastOutTime'],each['GrossWorkingHours'][:-3],each['NetWorkingHours'][:-3], each['timesheet_total_working_hours']])
                    # for i,eachpunch in enumerate(each['punchdata']):
                    #     if('P'+str(i) not in data[0]):
                    #         data[0].append('P'+str(i))
                    #     data[-1].append(str(eachpunch['In'])+'|'+str(eachpunch['Out'])+'|'+str(eachpunch['Net']))
            e.writeExcel(data,row_start=0,long_column_list=[2])
            del e
            return response
        else:
            basename=final_datastructure[0]['emp_name']+"_Attendance_"+str(from_date)+'_'+str(to_date)+'.xlsx'
            response=utils.contentTypesResponce('xl',basename)
            e=ExcelServices(response,in_memory=True,workSheetName="Attendance Report",cell_format={'font_size': 10,'font_name':'Arial','align':'left'})
            columns=['Staff No','Name','Date','FirstInTime','LastOutTime','Gross Working Hours','Net Working Hours', 'Timesheet Posted Hours']
            data=[columns]
            for each in final_datastructure:
                data.append([each['staff_no'],each['emp_name'],each['Date'],each['FirstInTime'],each['LastOutTime'],each['GrossWorkingHours'][:-3],each['NetWorkingHours'][:-3], each['timesheet_total_working_hours']])
                for i,eachpunch in enumerate(each['punchdata']):
                    if('P'+str(i) not in data[0]):
                        data[0].append('P'+str(i))
                    data[-1].append(str(eachpunch['In'])+'|'+str(eachpunch['Out'])+'|'+str(eachpunch['Net']))
            e.writeExcel(data,row_start=0,long_column_list=[2])
            del e
            return response
        # return Response(utils.StyleRes(False,'failure',{'msg':'employee id not exists'}), status=StatusCode.HTTP_OK)

class AttendanceStatusAPI(APIView):
    @jwttokenvalidator
    @custom_exceptions
    def get(self,request):
        auth_details = utils.validateJWTToken(request)
        if(auth_details['email']==""):
            return Response(auth_details, status=400)
        attendance_flag = False
        emp_id=auth_details['emp_id']
        individual_att_access_list=[]
        global_attendance_access = GlobalAccessFlag.objects.filter(status=1,access_type__iexact='ATTENDANCE')
        if(len(global_attendance_access)>0):
            att_access_grp_list = list(map(lambda x:x.emp_id,Employee.objects.filter(role_id=4,status=1)))
        else:
            att_access_grp_obj = AttendanceAccessGroup.objects.filter(status=1)
            att_access_grp_list = list(map(lambda x: x.emp_id,att_access_grp_obj))
            att_access_individ_obj = AttendanceAccessGroup.objects.filter(status=2,emp_id=emp_id)
            individual_att_access_list = list(map(lambda x: x.emp_id,att_access_individ_obj))

        emp_hierarchy_obj = EmployeeHierarchy.objects.filter(manager_id__in=att_access_grp_list,emp_id=emp_id)
        if(len(emp_hierarchy_obj)>0 or len(individual_att_access_list)>0):
            attendance_flag = True
        return Response({'attendance_flag':attendance_flag})
