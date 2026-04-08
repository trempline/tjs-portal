import { TestBed } from '@angular/core/testing';
import { HostManagerService, HostManagerDashboardStats } from './host-manager.service';
import { SupabaseService } from './supabase.service';
import { of, throwError } from 'rxjs';

describe('HostManagerService', () => {
  let service: HostManagerService;
  let supabaseServiceSpy: jasmine.SpyObj<SupabaseService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('SupabaseService', ['getAdminSupabase']);

    TestBed.configureTestingModule({
      providers: [
        HostManagerService,
        { provide: SupabaseService, useValue: spy }
      ]
    });

    service = TestBed.inject(HostManagerService);
    supabaseServiceSpy = TestBed.inject(SupabaseService) as jasmine.SpyObj<SupabaseService>;

    // Mock adminSupabase
    supabaseServiceSpy.getAdminSupabase.and.returnValue({
      from: jasmine.createSpy('from').and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue({
            single: jasmine.createSpy('single').and.resolveTo({ data: null, error: null })
          })
        })
      })
    } as any);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDashboardStats', () => {
    it('should return dashboard stats for a manager', (done) => {
      // Mock the service to return empty hosts
      supabaseServiceSpy.getAdminSupabase.and.returnValue({
        from: jasmine.createSpy('from').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            eq: jasmine.createSpy('eq').and.returnValue({
              map: jasmine.createSpy('map').and.callFake((fn: any) => {
                return of({ data: [], error: null });
              })
            })
          })
        })
      } as any);

      service.getDashboardStats('manager-123').subscribe({
        next: (stats: HostManagerDashboardStats) => {
          expect(stats).toBeDefined();
          expect(stats.total_hosts).toBe(0);
          done();
        },
        error: fail
      });
    });

    it('should handle errors gracefully', (done) => {
      supabaseServiceSpy.getAdminSupabase.and.returnValue({
        from: jasmine.createSpy('from').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            eq: jasmine.createSpy('eq').and.returnValue({
              map: jasmine.createSpy('map').and.callFake(() => {
                return throwError(() => new Error('Test error'));
              })
            })
          })
        })
      } as any);

      service.getDashboardStats('manager-123').subscribe({
        next: () => fail('Expected error'),
        error: (error) => {
          expect(error).toBeDefined();
          done();
        }
      });
    });
  });

  describe('isHostManager', () => {
    it('should return true if user is a host manager', (done) => {
      supabaseServiceSpy.getAdminSupabase.and.returnValue({
        from: jasmine.createSpy('from').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            eq: jasmine.createSpy('eq').and.returnValue({
              map: jasmine.createSpy('map').and.callFake((fn: any) => {
                return of({
                  data: [{ role: { name: 'Host Manager' } }],
                  error: null
                });
              })
            })
          })
        })
      } as any);

      service.isHostManager('user-123').subscribe({
        next: (isManager: boolean) => {
          expect(isManager).toBe(true);
          done();
        },
        error: fail
      });
    });

    it('should return false if user is not a host manager', (done) => {
      supabaseServiceSpy.getAdminSupabase.and.returnValue({
        from: jasmine.createSpy('from').and.returnValue({
          select: jasmine.createSpy('select').and.returnValue({
            eq: jasmine.createSpy('eq').and.returnValue({
              map: jasmine.createSpy('map').and.callFake(() => {
                return of({ data: [], error: null });
              })
            })
          })
        })
      } as any);

      service.isHostManager('user-123').subscribe({
        next: (isManager: boolean) => {
          expect(isManager).toBe(false);
          done();
        },
        error: fail
      });
    });
  });
});