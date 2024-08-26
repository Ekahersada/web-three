import { Dialog } from '@angular/cdk/dialog';
import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-modal-setting',
  templateUrl: './modal-setting.component.html',
  styleUrls: ['./modal-setting.component.css']
})
export class ModalSettingComponent implements OnInit {

  myName:any;


  readonly dialogRef = inject(MatDialogRef<ModalSettingComponent>);
  readonly data = inject<any>(MAT_DIALOG_DATA);

  constructor(
    
  ) { }

  ngOnInit() {
    // if(this.data){
    //   this.myName = this.data;
    // }
  }

  submit(){
    if(this.myName){
      this.dialogRef.close({name:this.myName});
    }
  }

}
