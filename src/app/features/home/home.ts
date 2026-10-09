import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ApiService } from '../../core/http/api.service';
@Component({selector:'app-home',imports:[RouterLink,MatButtonModule],templateUrl:'./home.html',styleUrl:'./home.scss'})
export class Home { api=inject(ApiService); get destination(){return this.api.session()?(this.api.session()?.onboardingComplete?'/orcamentos':'/empresa'):'/criar-conta';} }
