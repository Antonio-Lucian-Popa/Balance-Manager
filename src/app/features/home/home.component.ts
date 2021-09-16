import { ModalAddBalanceComponent } from './modal-add-balance/modal-add-balance.component';
import { Component, Inject, LOCALE_ID, OnInit, ViewChild } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ChartOptions, ChartType } from 'chart.js';
import { BaseChartDirective, Color, Label, MultiDataSet } from 'ng2-charts';
import * as Chart from 'chart.js';
import { formatNumber } from '@angular/common';
import { async } from 'rxjs';
import { AlertController } from '@ionic/angular';
import { History } from '../types/history';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {

  @ViewChild(BaseChartDirective) chart: BaseChartDirective;

  // Doughnut
  public doughnutChartLabels: Label[] = ['Withdrawals', 'Balance'];
  public doughnutChartData: MultiDataSet = [[0, 0]];
  public doughnutChartType: ChartType = 'doughnut';
  public color: Color[] = [{ backgroundColor: ['#E94560', '#150050'] }];

  public currentBalance: string;
  public withdrawals: number[] = [];
  public remainingBalance: number;

  public option: ChartOptions = {
    legend: {
      labels: {
        fontColor: 'white',
        fontSize: 18,
      },
    },
  };

  private totalWithdrawal = 0;

  private history: History[] = [];

  constructor(
    public modalController: ModalController,
    @Inject(LOCALE_ID) public locale: string,
    public alertController: AlertController
  ) {}

  ngOnInit(): void {}

  public addBalance(): void {
    this.presentModal('balance');
  }
  public addWithdrawal(): void {
    this.presentModal('withdrawal');
  }

  async presentModal(type: string) {
    const modal = await this.modalController.create({
      component: ModalAddBalanceComponent,
      componentProps: {
        type,
      },
    });
    modal.onDidDismiss().then((data) => {
      if (data.data) {
        if (data.data.isBalance) {
          this.addValueToBalance(data.data.value);
        } else {
          this.addValueToWithdrawals(data.data.value);
        }
        this.addHistory(data.data);
      }
    });
    return await modal.present();
  }


  private addValueToBalance(currentBalance: number): void {
    if(currentBalance > 0 && currentBalance >= this.totalWithdrawal) {
      this.remainingBalance = (this.totalWithdrawal > 0) ? currentBalance - this.totalWithdrawal : currentBalance;
      this.doughnutChartData[0][1] = this.remainingBalance;
      this.currentBalance = formatNumber(this.remainingBalance, this.locale);
      this.chart.chart.update();
    } else {
      this.createAlert('You entered a wrong value');
    }
  }

  private addValueToWithdrawals(currentWithdrawal: number): void {
    if(currentWithdrawal > 0) {
      if (
        this.withdrawals.length === 0 &&
        currentWithdrawal <= this.remainingBalance
      ) {
        this.withdrawals.push(currentWithdrawal);
        this.totalWithdrawal = currentWithdrawal;
        this.remainingBalance = this.remainingBalance - currentWithdrawal;
        this.currentBalance = formatNumber(this.remainingBalance, this.locale);
        this.doughnutChartData[0][0] = this.totalWithdrawal;
        this.doughnutChartData[0][1] = this.remainingBalance;
        this.chart.chart.update();
      } else if(currentWithdrawal <= this.remainingBalance) {
        if (this.remainingBalance - currentWithdrawal >= 0) {
          this.withdrawals.push(currentWithdrawal);
          const calculateTotalWithdrawal = this.withdrawals.reduce(
            (partialSum, a) => partialSum + a,
            0
          );
          this.totalWithdrawal = calculateTotalWithdrawal;
          this.remainingBalance = this.remainingBalance - currentWithdrawal;
          this.currentBalance = formatNumber(this.remainingBalance, this.locale);
          this.doughnutChartData[0][0] = this.totalWithdrawal;
          this.doughnutChartData[0][1] = this.remainingBalance;
          this.chart.chart.update();
        } else {
          this.createAlert('Your withdrawals are too large for the balance you have');
        }
      } else {
        this.createAlert('Your withdrawals are too large for the balance you have');
      }
    } else {
      this.createAlert('You entered a wrong value');
    }
  }

  private async createAlert(message: string) {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Problem',
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  private addHistory(detail: any): void {
   const createHistory: History = {
     value: detail.value,
     description: detail.motivationOfWithdrawal,
     createdAt: detail.createdAt
   };
   this.history.push(createHistory);
   console.log(this.history);
  }
}
