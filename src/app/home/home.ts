import { Component, OnInit, inject } from '@angular/core';
import { SharedModule } from '../shared/shared-module';
import { DatePipe, NgClass, SlicePipe, TitleCasePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, NgModel } from '@angular/forms';
import { PublicTjsArtistItem, PublicWebsiteEventItem, SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-home',
  imports: [SharedModule, RouterModule, FormsModule],
  templateUrl: './home.html',
})
export class Home implements OnInit {
  private supabaseService = inject(SupabaseService);

  upcomingEvents: PublicWebsiteEventItem[] = [];
  featuredArtists: PublicTjsArtistItem[] = [];
  isLoadingUpcomingEvents = true;
  isLoadingFeaturedArtists = true;
  upcomingEventsError = '';
  featuredArtistsError = '';

  async ngOnInit() {
    await Promise.all([
      this.loadUpcomingEvents(),
      this.loadFeaturedArtists(),
    ]);
  }

  donation(){
    window.open('https://www.helloasso.com/associations/tremplin-jeunes-solistes/formulaires/1', '_blank');
  }
  
  becomeMember(){
    window.open('https://www.helloasso.com/associations/tremplin-jeunes-solistes/adhesions/adhesion-a-tremplin-jeunes-solistes', '_blank');
  }
  
  goYoutube(){

  }
  
  isShowPast(id:any){

  }
  
  toggleDates(id:any){
  }

  expandedEvents: boolean[] = [];

  formatArtists(names: string[]): string {
    if (names.length === 0) {
      return 'Artist to be announced';
    }

    if (names.length === 1) {
      return names[0];
    }

    if (names.length === 2) {
      return `${names[0]} & ${names[1]}`;
    }

    return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
  }

  formatEventDate(item: PublicWebsiteEventItem): string {
    const date = item.primary_date;
    if (!date) {
      return 'Date TBA';
    }

    return new Intl.DateTimeFormat(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(`${date}T00:00:00`));
  }

  instrumentsLabel(item: { instruments: string[] }): string {
    return item.instruments.length > 0 ? item.instruments.join(', ') : 'Instruments TBA';
  }

  performanceTypesLabel(artist: PublicTjsArtistItem): string {
    return artist.performance_types.length > 0 ? artist.performance_types.join(', ') : 'Performance type TBA';
  }

  artistInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return 'TJS';
    }

    return parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
  }

  private async loadUpcomingEvents() {
    this.isLoadingUpcomingEvents = true;
    this.upcomingEventsError = '';

    try {
      const events = await this.supabaseService.getPublicWebsiteEvents();
      const today = new Date().toISOString().slice(0, 10);
      this.upcomingEvents = events
        .filter((event) => (event.last_date || event.primary_date || '') >= today)
        .sort((left, right) => {
          const leftDate = left.primary_date ?? '9999-12-31';
          const rightDate = right.primary_date ?? '9999-12-31';
          if (leftDate !== rightDate) {
            return leftDate.localeCompare(rightDate);
          }

          return left.title.localeCompare(right.title);
        })
        .slice(0, 5);
    } catch (error) {
      this.upcomingEventsError = error instanceof Error ? error.message : 'Upcoming events could not be loaded.';
    } finally {
      this.isLoadingUpcomingEvents = false;
    }
  }

  private async loadFeaturedArtists() {
    this.isLoadingFeaturedArtists = true;
    this.featuredArtistsError = '';

    try {
      this.featuredArtists = await this.supabaseService.getPublicTjsArtists({ featuredOnly: true });
    } catch (error) {
      this.featuredArtistsError = error instanceof Error ? error.message : 'Featured artists could not be loaded.';
    } finally {
      this.isLoadingFeaturedArtists = false;
    }
  }
  
  async submitNewsletter() {
    // Validate form
    if (!this.newsletter.email || !this.newsletter.message) {
      alert('Veuillez remplir tous les champs obligatoires (email et message)');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.newsletter.email)) {
      alert('Veuillez entrer une adresse email valide');
      return;
    }

    this.isSubmitting = true;

    try {
      const result = await this.supabaseService.submitMessage({
        prenom: this.newsletter.prenom || '',
        nom: this.newsletter.nom || '',
        email: this.newsletter.email,
        message: this.newsletter.message
      });

      if (result.success) {
        alert('Merci! Votre message a été envoyé avec succès.');
        // Reset form
        this.newsletter = {
          prenom: '',
          nom: '',
          email: '',
          message: ''
        };
      } else {
        alert('Une erreur est survenue. Veuillez réessayer plus tard.');
      }
    } catch (error) {
      console.error('Error submitting newsletter:', error);
      alert('Une erreur est survenue. Veuillez réessayer plus tard.');
    } finally {
      this.isSubmitting = false;
    }
  }

  newsletter: any = {
    prenom: '',
    nom: '',
    email: '',
    message: ''
  };
  
  isSubmitting: any = false;
}
