import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { MembershipPaymentRecord, TjsProfile, SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-header',
  standalone: false,
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header implements OnInit, OnDestroy {
  urlID: any;
  isMenuOpen = false;
  isDropdownOpen = false;
  isMobileDropdownOpen = false;
  isMemberDropdownOpen = false;
  isMobileMemberPanelOpen = false;
  memberProfile: TjsProfile | null = null;
  memberPayment: MembershipPaymentRecord | null = null;

  private subscription = new Subscription();

  constructor(
    private router: Router,
    private authService: AuthService,
    private supabase: SupabaseService,
  ) {}

  async ngOnInit() {
    await this.authService.waitForAuthReady();
    this.memberProfile = this.authService.currentProfile;
    await this.loadMembershipSummary();

    this.subscription.add(
      this.authService.state$.subscribe(async (state) => {
        this.memberProfile = state.profile;
        await this.loadMembershipSummary();
      })
    );

    this.subscription.add(
      this.router.events
        .pipe(filter((event) => event instanceof NavigationEnd))
        .subscribe(() => {
          this.isMenuOpen = false;
          this.isDropdownOpen = false;
          this.isMobileDropdownOpen = false;
          this.isMemberDropdownOpen = false;
          this.isMobileMemberPanelOpen = false;
        })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  get isMemberSession(): boolean {
    return this.authService.isPublicMember;
  }

  get shouldShowMemberLoginButton(): boolean {
    return true;
  }

  get memberDisplayName(): string {
    return this.memberProfile?.full_name || this.memberProfile?.email || 'Member';
  }

  get membershipStatusLabel(): string {
    return this.authService.membershipStatus === 'active'
      ? 'Active'
      : this.authService.membershipStatus === 'expired'
        ? 'Expired'
        : 'Not active';
  }

  get membershipStatusClass(): string {
    return this.authService.membershipStatus === 'active'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : this.authService.membershipStatus === 'expired'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : 'border-zinc-200 bg-zinc-100 text-zinc-600';
  }

  get memberPaidThrough(): string {
    return this.memberProfile?.member_until || 'Not available';
  }

  get memberTier(): string {
    return this.memberPayment?.tier || 'TJS Member';
  }

  get memberLastPaymentDate(): string {
    return this.memberPayment?.payment_date || 'Not available';
  }

  get memberPaymentAmountLabel(): string {
    if (this.memberPayment?.amount == null) {
      return 'Not recorded';
    }

    return `${this.memberPayment.amount} ${this.memberPayment.currency || 'EUR'}`;
  }

  async goToMemberLogin() {
    await this.router.navigate(['/member-login'], {
      queryParams: { returnUrl: this.router.url || '/events' },
    });
  }

  async logoutMember() {
    await this.authService.signOut();
  }

  toggleMemberDropdown() {
    this.isMemberDropdownOpen = !this.isMemberDropdownOpen;
  }

  toggleMobileMemberPanel() {
    this.isMobileMemberPanelOpen = !this.isMobileMemberPanelOpen;
  }

  getMenuItemClass(urlID: any) {
    return '';
  }

  private async loadMembershipSummary() {
    if (!this.authService.isAuthenticated || !this.authService.isPublicMember || !this.memberProfile?.id) {
      this.memberPayment = null;
      return;
    }

    this.memberPayment = await this.supabase.getLatestMembershipPaymentForProfile(this.memberProfile.id);
  }
}
