import { AsyncPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, SimpleChanges } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { AlarmClock, Ban, Circle, Loader, LucideAngularModule, SquareUserRound, XCircle } from 'lucide-angular';
import { BehaviorSubject } from 'rxjs';
import { filter, finalize } from 'rxjs/operators';
import { ModalComponent } from "../../shared/ui/modal/modal.component";
import { TaxusHeaderComponent } from "./taxus-header/taxus-header.component";
import { ApiResponse, ApiStatus } from '@src/app/core/models/api-response.model';
import { TaxusLayoutService } from './taxus-layout.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ButtonComponent } from "../../shared/ui/button/button.component";
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'layout-taxus',
  standalone: true,
  imports: [RouterOutlet, RouterLink, NgClass, NgFor, NgIf, AsyncPipe, TaxusHeaderComponent, ModalComponent, LucideAngularModule, MatProgressSpinnerModule, ButtonComponent],
  templateUrl: './taxus-layout.component.html',
  styleUrl: './taxus-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaxusLayoutComponent implements OnInit {
  private activeLinkSubject = new BehaviorSubject<string>('/');
  activeLink$ = this.activeLinkSubject.asObservable();
  pageTitle = 'Dashboard';
  dashboardIcon = './assets/icons/dashboard.png'
  partnerIcon = './assets/icons/addPerson.png'
  inventoryIcon = './assets/icons/inventory.png'
  salesIcon = './assets/icons/sales.png'
  eWayBillIcon = './assets/icons/e-way.png'
  purchaseIcon = './assets/icons/purchase.png'
  gstIcon = './assets/icons/gst.png'
  erpIcon = './assets/icons/erp.png'
  userProfileIcon = './assets/icons/user.png'
  settingsIcon = './assets/icons/settings.png'
  helpIcon = './assets/icons/help.png'
  accessPending = './assets/images/accessPending.png'
  accessStatus = 'pending'
  pendingIcon = AlarmClock
  rejectedIcon = Ban
  deactivatedIcon = Circle
  userIcon = SquareUserRound
  statusInfo = {
    status: '',
    adminMail: '',
    userMail: '',
  }
  currentEntity = '';
  isLoading = true;
  isSendingApproval = false;
  temp = true

  pageTitlesMap: Record<string, string> = {
    '/': 'Business Dashboard',
    '/partner': 'Partner Information',
    '/inventory': 'Inventory Management',
    '/sales': 'Sales Transactions',
    '/e-way': 'E-Way Bill Management',
    '/purchase': 'Purchase Transactions',
    '/gst': 'GST Solutions',
    '/erp': 'ERP Integration',
    '/profile': 'User Profile & Roles',
    '/settings': 'Settings',
    '/help': 'Help & Support',
  };

  allMenu = [
    { name: 'Business Dashboard', routerLink: '/', icon: this.dashboardIcon },
    { name: 'Partner Information', routerLink: '/partner', icon: this.partnerIcon },
    { name: 'Inventory', routerLink: '/inventory', icon: this.inventoryIcon },
    { name: 'Sales Transactions', routerLink: '/sales', icon: this.salesIcon },
    { name: 'e-Way Bill', routerLink: '/e-way', icon: this.eWayBillIcon },
    { name: 'Purchase Transactions', routerLink: '/purchase', icon: this.purchaseIcon },
    { name: 'GST Solutions', routerLink: '/gst', icon: this.gstIcon },
    { name: 'ERP Integration', routerLink: '/erp', icon: this.erpIcon },
  ];

  mainMenu = [
    { name: 'Business Dashboard', routerLink: '/', icon: this.dashboardIcon },
    { name: 'Partner Information', routerLink: '/partner', icon: this.partnerIcon },
    { name: 'Inventory', routerLink: '/inventory', icon: this.inventoryIcon },
    { name: 'Sales Transactions', routerLink: '/sales', icon: this.salesIcon },
    { name: 'e-Way Bill', routerLink: '/e-way', icon: this.eWayBillIcon },
    { name: 'Purchase Transactions', routerLink: '/purchase', icon: this.purchaseIcon },
    { name: 'GST Solutions', routerLink: '/gst', icon: this.gstIcon },
    { name: 'ERP Integration', routerLink: '/erp', icon: this.erpIcon },
  ];

  otherMenu = [
    { name: 'User Profile & Roles', routerLink: '/profile', icon: this.userProfileIcon },
    { name: 'Settings', routerLink: '/settings', icon: this.settingsIcon },
    { name: 'Help & Support', routerLink: '/help', icon: this.helpIcon },
  ];

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private taxusService: TaxusLayoutService,
    private toastr: ToastrService,
  ) { }

  ngOnInit() {
    this.getEntityMap();
    this.activeLinkSubject.next(this.router.url);  // Set initial activeLink
    this.updatePageTitle(this.router.url);

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.activeLinkSubject.next(event.urlAfterRedirects);
        this.updatePageTitle(event.urlAfterRedirects);
        this.cdr.markForCheck();
      });
  }

  // ngOnChanges(changes: SimpleChanges): void {
  //   if (changes['statusInfo']) {
  //     this.statusInfo = changes['statusInfo'].currentValue;
  //   }
  //   if (changes["isLoading"]) {
  //     this.isLoading = changes["isLoading"].currentValue;
  //   }
  //   if (changes["accessStatus"]) {
  //     this.accessStatus = changes["accessStatus"].currentValue;
  //   }
  // }

  private updatePageTitle(url: string) {
    this.pageTitle = this.pageTitlesMap[url] || 'Dashboard';
  }

  isActive(routerLink: string): boolean {
    return this.activeLinkSubject.getValue() === routerLink;
  }

  getEntityMap() {
    this.taxusService.entityMap().pipe(
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (res: ApiResponse<any>) => {
        const { status, data } = res;
        if (status === ApiStatus.SUCCESS) {
          const { entityDetailsMap } = data;
          console.log('data on', entityDetailsMap);
          if (Object.keys(entityDetailsMap).length > 0) {
            this.currentEntity = Object.keys(entityDetailsMap)[0];
            this.getCacheSubEntity();
          } else {
            this.accessStatus = 'accepted';
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        }
      }
    });
  }

  getUserInfo() {
    this.taxusService.userInfo().subscribe({
      next: (response: ApiResponse<any>) => {
        const { status, data } = response;

        if (status === ApiStatus.SUCCESS) {
          const { status: accountStatus, adminMail, userMail } = data;

          this.statusInfo = {
            ...this.statusInfo,
            status: accountStatus === 'in-progress' ? 'pending' : accountStatus === 'rejected' ? 'denied' : accountStatus,
            adminMail,
            userMail,
          }
          this.accessStatus = accountStatus === 'in-progress' ? 'pending' : accountStatus === 'rejected' ? 'denied' : accountStatus;

          console.log('data on', this.statusInfo)
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      }
    })
  }

  getCacheSubEntity() {
    this.taxusService.cacheSubEntity({ entityId: this.currentEntity }).subscribe({
      next: (response: ApiResponse<any>) => {
        const { status } = response;
        if (status === ApiStatus.SUCCESS) {
          this.getUserInfo();
        }
      },
      error: () => {
        console.log('An error occurred');
      }

    })
  }

  getStatusIcon() {
    switch (this.statusInfo.status) {
      case 'pending':
        return AlarmClock;
      case 'denied':
        return XCircle;
      case 'deactivated':
        return Ban;
      default:
        return Loader
    }
  }

  sendApprovalRequest() {
    this.isSendingApproval = true;
    this.taxusService.sendApprovalRequest().pipe(
      finalize(() => {
        this.isSendingApproval = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (response: ApiResponse<any>) => {
        const { status } = response;
        if (status === ApiStatus.SUCCESS) {
          // this.getUserInfo();
          console.log('Resend Email Sent successfully!')
          this.toastr.info('E-Mail triggered successfully!');
        }
      }
    })
  }
}
