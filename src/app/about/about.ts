
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared-module';
import { SupabaseService } from '../services/supabase.service';
interface BureauMembers {
  name: string;
  title:string;
  image: string;
}

interface TeamMembers {
  name: string;
  title:string;
  image: string;
}

interface PartnerLogo {
  name: string;
  image: string;
  link?: string;
}

@Component({
  selector: 'app-about',
  imports: [FormsModule, SharedModule],
  templateUrl: './about.html',
})
export class About {
  private supabaseService = inject(SupabaseService);

  ngOnInit(): void {
  
}
isSubmitting = false;
submitError: string | null = null;
submitSuccess = false;
form = {
fname: '',
lname: '',
email: '',
msg: ''
};


bureauMembers: BureauMembers[] = [
{ name: 'Jean-Jacques Aillagon', title:'Fondateur et Stratégie', image: 'assets/images/people/jean.png' },
{ name: 'Véronique Gaudrat', title:'Fondatrice et présidente', image: 'assets/images/people/veronique.png' },
{ name: 'Pierre Poulain', title:'Fondateur et trésorier', image: 'assets/images/people/pierre.png' },

];


teamMembers: TeamMembers[] = [
  { name: 'Jean-Vincent Richard', title:'Fondateur et responsable des hôtes', image: 'assets/images/people/jeanv.png' },
  { name: 'Anne Peter Jay', title:'Juriste', image: 'assets/images/people/anne.png' },
  { name: 'Thuy Anh Vuong', title:'Sélection des artistes', image: 'assets/images/people/thuy.png' },
  { name: 'Jean-Philippe Le-Calvé', title:'Communication', image: 'assets/images/people/jeanp.png' },
  { name: 'Pascale Pouliquen', title:'En charge des hôtes', image: 'assets/images/people/pascale.png' },    
  { name: 'Véronique Dalbin', title:'Outils informatique', image: 'assets/images/people/dalbin.png' }    
  ];


async onSubmit(e:any){
  e.preventDefault();

  // Validate form
  if (!this.form.email || !this.form.msg) {
    this.submitError = 'Veuillez remplir tous les champs obligatoires (email et message)';
    return;
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(this.form.email)) {
    this.submitError = 'Veuillez entrer une adresse email valide';
    return;
  }

  this.isSubmitting = true;
  this.submitError = null;
  this.submitSuccess = false;

  try {
    const result = await this.supabaseService.submitMessage({
      prenom: this.form.fname || '',
      nom: this.form.lname || '',
      email: this.form.email,
      message: this.form.msg
    });

    if (result.success) {
      this.submitSuccess = true;
      // Reset form
      this.form = {
        fname: '',
        lname: '',
        email: '',
        msg: ''
      };
    } else {
      this.submitError = 'Une erreur est survenue. Veuillez réessayer plus tard.';
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    this.submitError = 'Une erreur est survenue. Veuillez réessayer plus tard.';
  } finally {
    this.isSubmitting = false;
  }
}
}
