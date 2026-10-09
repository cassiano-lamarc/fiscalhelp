import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ApiService, UserProfile } from '../../core/http/api.service';
import { FieldError } from '../../shared/field-error';
@Component({selector:'app-profile',imports:[ReactiveFormsModule,MatButtonModule,FieldError],templateUrl:'./profile.html',styleUrl:'./profile.scss'})
export class Profile implements OnInit {
  api=inject(ApiService);private fb=inject(FormBuilder);busy=signal(true);version=1;
  private destroyRef=inject(DestroyRef);
  form=this.fb.nonNullable.group({contactPhone:['',Validators.maxLength(50)],preparedByName:['',Validators.maxLength(150)]});
  async ngOnInit(){this.api.fieldErrors.set({});this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(()=>this.api.fieldErrors.set({}));try{const p=await this.api.request<UserProfile>('GET','/me/profile');this.version=p.version;this.form.patchValue({contactPhone:p.contactPhone||'',preparedByName:p.preparedByName||''});}catch{}finally{this.busy.set(false);}}
  hasChanges(){return this.form.dirty;}
  async save(){if(this.form.invalid){this.form.markAllAsTouched();return;}this.busy.set(true);this.api.fieldErrors.set({});try{const p=await this.api.request<UserProfile>('PATCH','/me/profile',{...this.form.getRawValue(),version:this.version});this.version=p.version;this.form.patchValue({contactPhone:p.contactPhone||'',preparedByName:p.preparedByName||''});this.form.markAsPristine();this.api.notice.set('Dados do usuário salvos.');}catch{}finally{this.busy.set(false);}}
  async linkGoogle(){this.busy.set(true);try{await this.api.csrf();const token=decodeURIComponent(document.cookie.split('; ').find(c=>c.startsWith('XSRF-TOKEN='))?.split('=').slice(1).join('=')||'');const form=document.createElement('form');form.method='POST';form.action='/api/v1/auth/google/link/start';const input=document.createElement('input');input.type='hidden';input.name='__RequestVerificationToken';input.value=token;form.append(input);document.body.append(form);form.submit();}catch{this.busy.set(false);}}
}
