import { Injectable, inject, PLATFORM_ID, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private readonly url = 'http://localhost:3009';
  private platformId = inject(PLATFORM_ID);
  private ngZone = inject(NgZone);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.ngZone.runOutsideAngular(() => {
        this.socket = io(this.url);
      });
    }
  }

  onEvent<T = unknown>(event: string): Observable<T> {
    return new Observable<T>(observer => {
      if (!this.socket) {
        return;
      }
      
      this.socket.on(event, (data: T) => {
        this.ngZone.run(() => observer.next(data));
      });
    });
  }

  emit(event: string, data: unknown) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}
