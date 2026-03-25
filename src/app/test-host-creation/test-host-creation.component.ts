import { NgFor, NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { HostManagementService, CreateHostAccountRequest, CreateHostAccountResponse } from '../services/host-management.service';

@Component({
  selector: 'app-test-host-creation',
  imports: [NgIf, NgFor],
  templateUrl: './test-host-creation.component.html',
  styleUrls: ['./test-host-creation.component.scss']
})
export class TestHostCreationComponent implements OnInit {
  testRequest: CreateHostAccountRequest = {
    host_details: {
      name: 'Test Host',
      email: 'test.host@example.com',
      phone: '+1234567890'
    },
    host_manager_id: 'test-manager-id',
    managing_members: [
      {
        name: 'Test Member 1',
        email: 'member1@example.com'
      },
      {
        name: 'Test Member 2',
        email: 'member2@example.com'
      }
    ],
    assigned_venues: [
      {
        venue_id: 'venue-001',
        location: 'Test Venue 1'
      },
      {
        venue_id: 'venue-002',
        location: 'Test Venue 2'
      }
    ]
  };

  response: CreateHostAccountResponse | null = null;
  isLoading = false;
  errorMessage = '';

  constructor(private hostManagementService: HostManagementService) {}

  ngOnInit(): void {}

  async createTestHost(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';
    
    try {
      const result = await this.hostManagementService.createHostAccount(this.testRequest).toPromise();
      this.response = result || null;
      
      if (result?.status === 'SUCCESS') {
        console.log('Host account created successfully:', result);
      } else {
        console.warn('Host account creation completed with errors:', result);
      }
    } catch (error) {
      console.error('Error creating host account:', error);
      this.errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    } finally {
      this.isLoading = false;
    }
  }

  clearTest(): void {
    this.response = null;
    this.errorMessage = '';
  }
}
