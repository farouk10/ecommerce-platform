import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { Product } from '../../../../shared/models';
import {
  CategoryService,
  Category,
} from '../../../../core/services/category.service';

@Component({
  selector: 'app-product-detail-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './product-detail-admin.component.html',
})
export class ProductDetailAdminComponent implements OnInit {
  productForm: FormGroup;
  isEditing = false;
  productId: number | null = null;

  // State
  activeTab = 'general';
  isUploading = false;

  // Data
  categories: Category[] = [];
  selectedFiles: File[] = [];
  previewImages: string[] = [];

  private readonly API_URL = `${environment.productServiceUrl}`;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private categoryService: CategoryService
  ) {
    this.productForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      stockQuantity: [0, [Validators.required, Validators.min(0)]],
      categoryId: [null, Validators.required],
    });
  }

  ngOnInit() {
    // Load Categories
    this.categoryService
      .getAllCategories()
      .subscribe((cats) => (this.categories = cats));

    // Check Navigation Mode (New vs Edit)
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id && id !== 'new') {
        this.isEditing = true;
        this.productId = +id;
        this.loadProduct(this.productId);
      }
    });
  }

  loadProduct(id: number) {
    this.http.get<Product>(`${this.API_URL}/${id}`).subscribe({
      next: (product) => {
        this.productForm.patchValue(product);
        if (product.images) {
          this.previewImages = product.images;
        } else if (product.imageUrl) {
          this.previewImages = [product.imageUrl];
        }
      },
      error: (err) => {
        console.error('Error loading product', err);
        // Navigate back if not found?
      },
    });
  }

  getCategoryName(id: number): string {
    const cat = this.categories.find((c) => c.id == id);
    return cat ? cat.name : 'Non classé';
  }

  // --- Image Handling ---

  onFileSelected(event: any) {
    const files = Array.from(event.target.files) as File[];

    if (this.previewImages.length + files.length > 5) {
      alert('Max 5 images autorisées');
      return;
    }

    this.selectedFiles = [...this.selectedFiles, ...files];

    // Generate Previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewImages.push(e.target.result);
      };
      reader.readAsDataURL(file);
    });
  }

  removeImage(index: number) {
    this.previewImages.splice(index, 1);
    // Logic to remove from selectedFiles is complex due to mix of URL vs File
    // For MVP, we just clear the preview. On save, we handle logic.
    // If it's an existing URL, we don't need to do anything special other than not submitting it?
    // TODO: Improve this logic.
  }

  // --- Submission ---

  submitForm() {
    if (this.productForm.invalid) return;
    this.isUploading = true;

    // First upload images if any
    if (this.selectedFiles.length > 0) {
      this.uploadImages().subscribe({
        next: (newUrls) => {
          // Combine with existing URLs (that are not base64)
          const existingUrls = this.previewImages.filter((url) =>
            url.startsWith('http')
          );
          const finalImages = [...existingUrls, ...newUrls];
          this.saveProduct(finalImages);
        },
        error: (err) => {
          console.error(err);
          this.isUploading = false;
        },
      });
    } else {
      // Only existing images
      const existingUrls = this.previewImages.filter((url) =>
        url.startsWith('http')
      );
      this.saveProduct(existingUrls);
    }
  }

  uploadImages() {
    const formData = new FormData();
    this.selectedFiles.forEach((file) => formData.append('files', file));
    return this.http.post<string[]>(`${this.API_URL}/upload`, formData);
  }

  saveProduct(imageUrls: string[]) {
    const productData = {
      ...this.productForm.value,
      images: imageUrls,
      imageUrl: imageUrls[0] || '', // Backward compatibility
    };

    const request = this.isEditing
      ? this.http.put(`${this.API_URL}/${this.productId}`, productData)
      : this.http.post(this.API_URL, productData);

    request.subscribe({
      next: () => {
        this.isUploading = false;
        this.router.navigate(['/admin/products']);
      },
      error: (err) => {
        console.error('Save failed', err);
        this.isUploading = false;
        alert('Erreur lors de la sauvegarde');
      },
    });
  }
}
