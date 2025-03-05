import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiStatus } from '@src/app/core/models/api-response.model';
import { ApprovalService } from './approval.service';

@Component({
  selector: 'app-access-status',
  standalone: false,
  templateUrl: './approval.component.html',
  styleUrls: ['./approval.component.scss']
})
export class ApprovalComponent implements OnInit {
  token: string | null = null;
  currentUrl: string = '';
  gstIN: string = '';
  userEmail: string = '';
  approvalActionStatus: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private approvalService: ApprovalService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || null;
      console.log('Extracted Token:', this.token);
    });

    this.currentUrl = window.location.href;

    this.approvalInfo();
  }

  approvalInfo() {
    if (this.token) {
      this.approvalService.approvalInfo(this.token).subscribe((response) => {
        const { status, message, data } = response;
        if (status === ApiStatus.SUCCESS) {
          const { gstNumber, email } = data;

          this.gstIN = gstNumber;
          this.userEmail = email;
          if (message === 'Already Approved') {
            this.approvalActionStatus = 'approved';
          } else if (message === 'Already Rejected') {
            this.approvalActionStatus = 'denied';
          }
        }
      });
    }
  }

  updateApprovalInfo(action: string) {
    if (this.token) {
      this.approvalActionStatus = action === 'deny' ? 'denied' : 'approved';
      this.approvalService.updateApprovalInfo(this.token, action.toUpperCase()).subscribe();
    }
  }
}
