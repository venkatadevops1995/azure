import { Component, OnInit, Input, HostBinding } from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ButtonComponent implements OnInit {

  @Input() type: 'button' | 'submit' = 'submit';

  @Input() size: 'default' | 'small' | 'extra-small' = 'default';

  @Input() disabled: boolean = false;

  @Input() theme: "default" | "blue-lite" | "black" | "blue-lite-extra" | "success" | "danger";

  // bind the disabled state with class empty
  @HostBinding('class.disabled') get isDisabled() { return this.disabled; };

  constructor() { }

  ngOnInit(): void {
  }

}
