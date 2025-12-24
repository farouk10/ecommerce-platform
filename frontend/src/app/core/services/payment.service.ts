import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PaymentInitResponse {
  paymentId: number;
  stripePaymentIntentId: string;
  clientSecret: string;
  status: string;
  amount: number;
  currency: string;
}

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private readonly API_URL = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  initiatePayment(
    orderId: number,
    amount: number,
    currency: string = 'eur'
  ): Observable<PaymentInitResponse> {
    const idempotencyKey = crypto.randomUUID();
    return this.http.post<PaymentInitResponse>(
      `${this.API_URL}/initiate`,
      { orderId, amount, currency },
      { headers: { 'Idempotency-Key': idempotencyKey } }
    );
  }

  verifyPayment(orderId: number): Observable<boolean> {
    return this.http.post<boolean>(`${this.API_URL}/verify/${orderId}`, {});
  }
}
