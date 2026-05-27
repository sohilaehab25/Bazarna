import { Injectable, computed, inject, signal } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, PRIMARY_OUTLET, Router } from '@angular/router';
import { filter } from 'rxjs';

export interface AdminBreadcrumb {
  label: string;
  url: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminBreadcrumbService {
  private readonly router = inject(Router);
  private readonly breadcrumbsState = signal<AdminBreadcrumb[]>([]);

  readonly breadcrumbs = this.breadcrumbsState.asReadonly();
  readonly hasBreadcrumbs = computed(() => this.breadcrumbsState().length > 0);

  constructor() {
    this.updateBreadcrumbs();

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.updateBreadcrumbs());
  }

  private updateBreadcrumbs(): void {
    const breadcrumbs = this.collectBreadcrumbs(this.router.routerState.snapshot.root);
    this.breadcrumbsState.set(breadcrumbs);
  }

  private collectBreadcrumbs(
    route: ActivatedRouteSnapshot,
    parentUrl = ''
  ): AdminBreadcrumb[] {
    const primaryChild = route.children.find((child) => child.outlet === PRIMARY_OUTLET);

    if (!primaryChild) {
      return [];
    }

    const segment = primaryChild.url.map((urlSegment) => urlSegment.path).join('/');
    const nextUrl = segment.length > 0 ? `${parentUrl}/${segment}` : parentUrl;
    const label = primaryChild.data['breadcrumb'];

    const current: AdminBreadcrumb[] =
      typeof label === 'string' && label.length > 0
        ? [{ label, url: nextUrl || '/admin' }]
        : [];

    return [...current, ...this.collectBreadcrumbs(primaryChild, nextUrl)];
  }
}
