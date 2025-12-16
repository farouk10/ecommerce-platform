import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { User } from '../../../shared/models';

@Component({
  selector: 'app-admin-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-profile.component.html',
  styleUrl: './admin-profile.component.css',
})
export class AdminProfileComponent implements OnInit {
  user: User | null = null;
  profileForm: FormGroup;
  editMode = false;
  isSubmitting = false;

  constructor(private authService: AuthService, private fb: FormBuilder) {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      email: [
        { value: '', disabled: true },
        [Validators.required, Validators.email],
      ],
      phoneNumber: [''],
      address: [''],
      bio: [''],
      avatarUrl: [''],
    });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
      if (user) {
        this.profileForm.patchValue({
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber,
          address: user.address,
          bio: user.bio,
          avatarUrl: user.avatarUrl,
        });
      }
    });
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode && this.user) {
      this.profileForm.patchValue(this.user);
    }
  }

  saveProfile(): void {
    if (this.profileForm.valid) {
      this.isSubmitting = true;
      const updatedData = this.profileForm.getRawValue();

      this.authService.updateProfile(updatedData).subscribe({
        next: (user) => {
          this.user = user;
          this.editMode = false;
          this.isSubmitting = false;
        },
        error: (err) => {
          console.error('Erreur update profil admin:', err);
          this.isSubmitting = false;
        },
      });
    }
  }
}
