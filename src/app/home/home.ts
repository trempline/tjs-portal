import { Component, inject } from '@angular/core';
import { SharedModule } from '../shared/shared-module';
import { DatePipe, NgClass, SlicePipe, TitleCasePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, NgModel } from '@angular/forms';
import { SupabaseService } from '../services/supabase.service';

@Component({
  selector: 'app-home',
  imports: [SharedModule, RouterModule, FormsModule],
  templateUrl: './home.html',
})
export class Home {
  private supabaseService = inject(SupabaseService);

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
