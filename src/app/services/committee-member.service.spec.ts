import { TestBed } from '@angular/core/testing';
import { CommitteeMemberService, CommitteeArtist, CommitteeEvent, CommitteeEventRequest, CommitteeDashboardStats } from './committee-member.service';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { of, throwError } from 'rxjs';

// Mock SupabaseService
const mockSupabaseService = {
  supabase: {
    from: jasmine.createSpy('from'),
    rpc: jasmine.createSpy('rpc')
  }
};

// Mock AuthService
const mockAuthService = {
  hasRole: jasmine.createSpy('hasRole').and.returnValue(true),
  currentUser: { id: 'test-user-id', email: 'test@example.com' }
};

describe('CommitteeMemberService', () => {
  let service: CommitteeMemberService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CommitteeMemberService,
        { provide: SupabaseService, useValue: mockSupabaseService },
        { provide: AuthService, useValue: mockAuthService }
      ]
    });

    service = TestBed.inject(CommitteeMemberService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isCommitteeMember', () => {
    it('should return true when user has Committee Member role', () => {
      mockAuthService.hasRole.and.returnValue(true);
      expect(service.isCommitteeMember()).toBe(true);
    });

    it('should return false when user does not have Committee Member role', () => {
      mockAuthService.hasRole.and.returnValue(false);
      expect(service.isCommitteeMember()).toBe(false);
    });
  });

  describe('getMyArtists', () => {
    it('should return observable of artists', (done) => {
      const mockArtists = [
        {
          id: 'artist-1',
          artist_name: 'Test Artist',
          is_tjs_artist: true,
          is_invited_artist: false,
          is_featured: false,
          activation_status: 'active',
          profile: { email: 'artist@test.com', full_name: 'Test Artist', avatar_url: null }
        }
      ];

      // Re-setup the spy for this test
      (mockSupabaseService.supabase.from as jasmine.Spy).and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          or: jasmine.createSpy('or').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue(
              Promise.resolve({ data: mockArtists, error: null })
            )
          })
        })
      });

      service.getMyArtists().subscribe({
        next: (artists) => {
          expect(artists.length).toBe(1);
          expect(artists[0].artist_name).toBe('Test Artist');
          done();
        },
        error: (error) => {
          fail('Should not have errored: ' + error);
          done();
        }
      });
    });

    it('should handle empty artists list', (done) => {
      (mockSupabaseService.supabase.from as jasmine.Spy).and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          or: jasmine.createSpy('or').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue(
              Promise.resolve({ data: [], error: null })
            )
          })
        })
      });

      service.getMyArtists().subscribe({
        next: (artists) => {
          expect(artists.length).toBe(0);
          done();
        }
      });
    });
  });

  describe('toggleArtistFeatured', () => {
    it('should toggle is_featured flag', (done) => {
      (mockSupabaseService.supabase.from as jasmine.Spy).and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          or: jasmine.createSpy('or').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue(
              Promise.resolve({ data: [], error: null })
            )
          }),
          eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ error: null }))
        }),
        update: jasmine.createSpy('update').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ error: null }))
        })
      });

      service.toggleArtistFeatured('artist-1', false).subscribe({
        next: () => {
          expect(mockSupabaseService.supabase.from).toHaveBeenCalledWith('tjs_artists');
          done();
        },
        error: (error) => {
          fail('Should not have errored: ' + error);
          done();
        }
      });
    });
  });

  describe('updateArtistActivationStatus', () => {
    it('should update activation status', (done) => {
      (mockSupabaseService.supabase.from as jasmine.Spy).and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          or: jasmine.createSpy('or').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue(
              Promise.resolve({ data: [], error: null })
            )
          }),
          eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ error: null }))
        }),
        update: jasmine.createSpy('update').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ error: null }))
        })
      });

      service.updateArtistActivationStatus('artist-1', 'active').subscribe({
        next: () => {
          expect(mockSupabaseService.supabase.from).toHaveBeenCalledWith('tjs_artists');
          done();
        },
        error: (error) => {
          fail('Should not have errored: ' + error);
          done();
        }
      });
    });
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', (done) => {
      // Mock getMyArtists to return data
      (mockSupabaseService.supabase.from as jasmine.Spy).and.returnValue({
        select: jasmine.createSpy('select').and.returnValue({
          or: jasmine.createSpy('or').and.returnValue({
            order: jasmine.createSpy('order').and.returnValue(
              Promise.resolve({ 
                data: [
                  { id: '1', activation_status: 'active', is_featured: true, profile: null },
                  { id: '2', activation_status: 'pending', is_featured: false, profile: null }
                ], 
                error: null 
              })
            )
          }),
          eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ error: null }))
        }),
        update: jasmine.createSpy('update').and.returnValue({
          eq: jasmine.createSpy('eq').and.returnValue(Promise.resolve({ error: null }))
        })
      });

      (mockSupabaseService.supabase.rpc as jasmine.Spy).and.returnValue(
        Promise.resolve({ data: ['1', '2'], error: null })
      );

      service.getDashboardStats().subscribe({
        next: (stats) => {
          expect(stats.totalArtists).toBe(2);
          expect(stats.activeArtists).toBe(1);
          expect(stats.pendingArtists).toBe(1);
          expect(stats.featuredArtists).toBe(1);
          done();
        },
        error: (error) => {
          fail('Should not have errored: ' + error);
          done();
        }
      });
    });
  });
});