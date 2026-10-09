import { Component, Input, inject } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { ApiService } from '../core/http/api.service';
@Component({selector:'app-field-error',template:`@if(control?.touched && control?.invalid){<small class="field-error">{{control?.hasError('required')?'Preencha este campo.':'Revise o formato e o tamanho deste campo.'}}</small>}@for(message of api.fieldErrors()[field] || [];track message){<small class="field-error">{{message}}</small>}`,styles:[`.field-error{display:block;color:#923d2c;margin:6px 0;font-size:12px}`]})
export class FieldError { @Input() control:AbstractControl|null=null; @Input() field=''; api=inject(ApiService); }
