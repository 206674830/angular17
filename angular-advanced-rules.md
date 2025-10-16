# Angular Advanced Rules - כללים מתקדמים

## 🎯 מטרת הקובץ
קובץ זה מכיל כללים מתקדמים וספציפיים לפיתוח Angular 19.
כללים אלו משלימים את הכללים הבסיסיים ומתמקדים בתכונות מתקדמות.

---

## 🆕 Angular 19 Specific Rules

### **1. Control Flow Syntax (חובה)**
```html
<!-- ✅ טוב - Control Flow החדש -->
@if (user(); as currentUser) {
  <div class="user-info">
    <h2>{{currentUser.name}}</h2>
    @if (currentUser.isAdmin) {
      <admin-badge></admin-badge>
    }
  </div>
} @else {
  <login-prompt></login-prompt>
}

@for (item of items(); track item.id; let i = $index, isOdd = $odd) {
  <div [class.odd-row]="isOdd">
    {{i + 1}}. {{item.title}}
  </div>
} @empty {
  <empty-state message="אין פריטים להצגה"></empty-state>
}

@switch (status()) {
  @case ('loading') {
    <loading-spinner></loading-spinner>
  }
  @case ('error') {
    <error-message [error]="error()"></error-message>
  }
  @case ('success') {
    <success-content [data]="data()"></success-content>
  }
  @default {
    <unknown-state></unknown-state>
  }
}

<!-- ❌ רע - Structural directives ישנים -->
<div *ngIf="user">{{user.name}}</div>
<div *ngFor="let item of items">{{item.title}}</div>
```

### **2. Deferrable Views (מומלץ לביצועים)**
```html
<!-- ✅ טוב - Lazy loading של קומפוננטים כבדים -->
@defer (on viewport) {
  <heavy-chart [data]="chartData()"></heavy-chart>
} @placeholder {
  <div class="chart-placeholder">
    <mat-progress-bar mode="indeterminate"></mat-progress-bar>
    <p>טוען נתונים...</p>
  </div>
} @loading (minimum 500ms) {
  <mat-spinner diameter="40"></mat-spinner>
} @error {
  <error-retry (retry)="loadChartData()"></error-retry>
}

<!-- Defer על אינטראקציה -->
@defer (on interaction) {
  <comments-section [postId]="postId()"></comments-section>
} @placeholder {
  <button mat-stroked-button>הצג תגובות</button>
}

<!-- Defer עם תנאים מרובים -->
@defer (on viewport; when isFeatureEnabled()) {
  <advanced-feature></advanced-feature>
} @placeholder {
  <feature-coming-soon></feature-coming-soon>
}
```

### **3. Event Replay (SSR)**
```typescript
// ✅ טוב - הגדרת Event Replay
// main.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { withEventReplay } from '@angular/platform-browser';

bootstrapApplication(AppComponent, {
  providers: [
    provideClientHydration(withEventReplay()),
    provideRouter(routes),
    // other providers
  ]
});

// Component עם Event Replay awareness
@Component({
  selector: 'app-interactive',
  template: `
    <button (click)="handleClick($event)" 
            [attr.data-replay-id]="buttonId">
      לחץ כאן
    </button>
  `
})
export class InteractiveComponent {
  readonly buttonId = `btn-${Math.random().toString(36).substr(2, 9)}`;
  
  handleClick(event: Event): void {
    // Event יוקלט ויושמע מחדש אחרי hydration
    console.log('Button clicked:', event);
  }
}
```

---

## ⚡ Advanced Signals Patterns

### **1. Signal Store Pattern**
```typescript
// ✅ טוב - Signal-based store
@Injectable({
  providedIn: 'root'
})
export class ProductStore {
  // Private state
  private readonly _products = signal<Product[]>([]);
  private readonly _selectedId = signal<string | null>(null);
  private readonly _filters = signal<ProductFilters>({});
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);
  
  // Public selectors
  readonly products = this._products.asReadonly();
  readonly selectedId = this._selectedId.asReadonly();
  readonly filters = this._filters.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  
  // Computed selectors
  readonly selectedProduct = computed(() => {
    const id = this._selectedId();
    return id ? this._products().find(p => p.id === id) ?? null : null;
  });
  
  readonly filteredProducts = computed(() => {
    const products = this._products();
    const filters = this._filters();
    
    return products.filter(product => {
      if (filters.category && product.category !== filters.category) return false;
      if (filters.minPrice && product.price < filters.minPrice) return false;
      if (filters.maxPrice && product.price > filters.maxPrice) return false;
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        return product.name.toLowerCase().includes(term) ||
               product.description.toLowerCase().includes(term);
      }
      return true;
    });
  });
  
  readonly productCount = computed(() => this.filteredProducts().length);
  
  readonly hasProducts = computed(() => this.productCount() > 0);
  
  // Actions
  loadProducts(): void {
    this._loading.set(true);
    this._error.set(null);
    
    this.productService.getProducts()
      .pipe(
        catchError(error => {
          this._error.set('שגיאה בטעינת מוצרים');
          return EMPTY;
        }),
        finalize(() => this._loading.set(false))
      )
      .subscribe(products => this._products.set(products));
  }
  
  selectProduct(id: string): void {
    this._selectedId.set(id);
  }
  
  updateFilters(filters: Partial<ProductFilters>): void {
    this._filters.update(current => ({ ...current, ...filters }));
  }
  
  addProduct(product: Product): void {
    this._products.update(current => [...current, product]);
  }
  
  updateProduct(id: string, updates: Partial<Product>): void {
    this._products.update(current =>
      current.map(product =>
        product.id === id ? { ...product, ...updates } : product
      )
    );
  }
  
  removeProduct(id: string): void {
    this._products.update(current => current.filter(p => p.id !== id));
    if (this._selectedId() === id) {
      this._selectedId.set(null);
    }
  }
}
```

### **2. Signal Effects for Side Effects**
```typescript
// ✅ טוב - Effects למעקב אחר שינויים
@Component({
  selector: 'app-product-list'
})
export class ProductListComponent {
  private readonly productStore = inject(ProductStore);
  private readonly router = inject(Router);
  private readonly analytics = inject(AnalyticsService);
  
  // Effect לשמירת filters ב-localStorage
  private readonly saveFiltersEffect = effect(() => {
    const filters = this.productStore.filters();
    localStorage.setItem('product-filters', JSON.stringify(filters));
  });
  
  // Effect למעקב אחר בחירת מוצר
  private readonly trackSelectionEffect = effect(() => {
    const selectedProduct = this.productStore.selectedProduct();
    if (selectedProduct) {
      this.analytics.trackEvent('product_selected', {
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        category: selectedProduct.category
      });
    }
  });
  
  // Effect לעדכון URL
  private readonly updateUrlEffect = effect(() => {
    const filters = this.productStore.filters();
    const queryParams: any = {};
    
    if (filters.category) queryParams.category = filters.category;
    if (filters.searchTerm) queryParams.search = filters.searchTerm;
    if (filters.minPrice) queryParams.minPrice = filters.minPrice;
    if (filters.maxPrice) queryParams.maxPrice = filters.maxPrice;
    
    this.router.navigate([], {
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  });
}
```

---

## 🏗️ Advanced Architecture Patterns

### **1. Feature Store Pattern**
```typescript
// ✅ טוב - Feature-specific store
@Injectable()
export class UserManagementStore {
  private readonly apiService = inject(ApiService);
  
  // State slices
  private readonly _users = signal<User[]>([]);
  private readonly _roles = signal<Role[]>([]);
  private readonly _permissions = signal<Permission[]>([]);
  private readonly _ui = signal<UserManagementUI>({
    selectedUserId: null,
    isCreateModalOpen: false,
    isEditModalOpen: false,
    sortBy: 'name',
    sortDirection: 'asc',
    pageSize: 10,
    currentPage: 1
  });
  
  // Selectors
  readonly users = this._users.asReadonly();
  readonly roles = this._roles.asReadonly();
  readonly permissions = this._permissions.asReadonly();
  readonly ui = this._ui.asReadonly();
  
  readonly selectedUser = computed(() => {
    const userId = this._ui().selectedUserId;
    return userId ? this._users().find(u => u.id === userId) ?? null : null;
  });
  
  readonly sortedUsers = computed(() => {
    const users = [...this._users()];
    const { sortBy, sortDirection } = this._ui();
    
    return users.sort((a, b) => {
      const aValue = a[sortBy as keyof User];
      const bValue = b[sortBy as keyof User];
      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  });
  
  readonly paginatedUsers = computed(() => {
    const users = this.sortedUsers();
    const { currentPage, pageSize } = this._ui();
    const startIndex = (currentPage - 1) * pageSize;
    return users.slice(startIndex, startIndex + pageSize);
  });
  
  readonly totalPages = computed(() => {
    const totalUsers = this._users().length;
    const pageSize = this._ui().pageSize;
    return Math.ceil(totalUsers / pageSize);
  });
  
  // Actions
  loadInitialData(): void {
    forkJoin({
      users: this.apiService.getUsers(),
      roles: this.apiService.getRoles(),
      permissions: this.apiService.getPermissions()
    }).subscribe(({ users, roles, permissions }) => {
      this._users.set(users);
      this._roles.set(roles);
      this._permissions.set(permissions);
    });
  }
  
  selectUser(userId: string): void {
    this._ui.update(ui => ({ ...ui, selectedUserId: userId }));
  }
  
  openCreateModal(): void {
    this._ui.update(ui => ({ ...ui, isCreateModalOpen: true }));
  }
  
  closeCreateModal(): void {
    this._ui.update(ui => ({ ...ui, isCreateModalOpen: false }));
  }
  
  updateSort(sortBy: string): void {
    this._ui.update(ui => ({
      ...ui,
      sortBy,
      sortDirection: ui.sortBy === sortBy && ui.sortDirection === 'asc' ? 'desc' : 'asc'
    }));
  }
  
  changePage(page: number): void {
    this._ui.update(ui => ({ ...ui, currentPage: page }));
  }
}
```

### **2. Smart/Dumb Component Pattern**
```typescript
// ✅ Smart Component (Container)
@Component({
  selector: 'app-user-management',
  template: `
    <app-user-list 
      [users]="store.paginatedUsers()"
      [loading]="store.loading()"
      [selectedUserId]="store.ui().selectedUserId"
      [sortBy]="store.ui().sortBy"
      [sortDirection]="store.ui().sortDirection"
      (userSelected)="store.selectUser($event)"
      (sortChanged)="store.updateSort($event)"
      (createUser)="store.openCreateModal()">
    </app-user-list>
    
    <app-pagination
      [currentPage]="store.ui().currentPage"
      [totalPages]="store.totalPages()"
      [pageSize]="store.ui().pageSize"
      (pageChanged)="store.changePage($event)">
    </app-pagination>
    
    @if (store.ui().isCreateModalOpen) {
      <app-user-create-modal
        [roles]="store.roles()"
        (userCreated)="handleUserCreated($event)"
        (cancelled)="store.closeCreateModal()">
      </app-user-create-modal>
    }
  `,
  providers: [UserManagementStore]
})
export class UserManagementComponent implements OnInit {
  protected readonly store = inject(UserManagementStore);
  
  ngOnInit(): void {
    this.store.loadInitialData();
  }
  
  handleUserCreated(user: User): void {
    this.store.addUser(user);
    this.store.closeCreateModal();
  }
}

// ✅ Dumb Component (Presentational)
@Component({
  selector: 'app-user-list',
  template: `
    <div class="user-list-header">
      <h2>ניהול משתמשים</h2>
      <button mat-raised-button color="primary" (click)="createUser.emit()">
        <mat-icon>add</mat-icon>
        הוסף משתמש
      </button>
    </div>
    
    @if (loading()) {
      <div class="loading-container">
        <mat-spinner></mat-spinner>
        <p>טוען משתמשים...</p>
      </div>
    } @else {
      <mat-table [dataSource]="users()" class="user-table">
        <ng-container matColumnDef="name">
          <mat-header-cell *matHeaderCellDef>
            <button mat-button (click)="sortChanged.emit('name')">
              שם
              @if (sortBy() === 'name') {
                <mat-icon>{{sortDirection() === 'asc' ? 'arrow_upward' : 'arrow_downward'}}</mat-icon>
              }
            </button>
          </mat-header-cell>
          <mat-cell *matCellDef="let user">{{user.name}}</mat-cell>
        </ng-container>
        
        <ng-container matColumnDef="email">
          <mat-header-cell *matHeaderCellDef>אימייל</mat-header-cell>
          <mat-cell *matCellDef="let user">{{user.email}}</mat-cell>
        </ng-container>
        
        <ng-container matColumnDef="actions">
          <mat-header-cell *matHeaderCellDef>פעולות</mat-header-cell>
          <mat-cell *matCellDef="let user">
            <button mat-icon-button (click)="userSelected.emit(user.id)">
              <mat-icon>edit</mat-icon>
            </button>
          </mat-cell>
        </ng-container>
        
        <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
        <mat-row *matRowDef="let row; columns: displayedColumns;"
                 [class.selected]="row.id === selectedUserId()"></mat-row>
      </mat-table>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserListComponent {
  readonly users = input.required<User[]>();
  readonly loading = input<boolean>(false);
  readonly selectedUserId = input<string | null>(null);
  readonly sortBy = input<string>('name');
  readonly sortDirection = input<'asc' | 'desc'>('asc');
  
  readonly userSelected = output<string>();
  readonly sortChanged = output<string>();
  readonly createUser = output<void>();
  
  readonly displayedColumns = ['name', 'email', 'actions'];
}
```

---

## 🔄 Advanced RxJS Patterns

### **1. RxJS + Signals Integration**
```typescript
// ✅ טוב - שילוב RxJS עם Signals
@Injectable({
  providedIn: 'root'
})
export class SearchService {
  private readonly http = inject(HttpClient);
  
  // Signal for search term
  private readonly _searchTerm = signal<string>('');
  readonly searchTerm = this._searchTerm.asReadonly();
  
  // Convert signal to observable for RxJS operations
  private readonly searchTerm$ = toObservable(this._searchTerm);
  
  // Search results observable
  readonly searchResults$ = this.searchTerm$.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    filter(term => term.length >= 2),
    switchMap(term => 
      this.http.get<SearchResult[]>(`/api/search?q=${encodeURIComponent(term)}`).pipe(
        catchError(error => {
          console.error('Search failed:', error);
          return of([]);
        })
      )
    ),
    shareReplay(1)
  );
  
  // Convert observable back to signal
  readonly searchResults = toSignal(this.searchResults$, { initialValue: [] });
  
  // Computed signals
  readonly hasResults = computed(() => this.searchResults().length > 0);
  readonly isSearching = computed(() => this.searchTerm().length >= 2);
  
  updateSearchTerm(term: string): void {
    this._searchTerm.set(term);
  }
}

// Component usage
@Component({
  selector: 'app-search',
  template: `
    <mat-form-field>
      <input matInput 
             placeholder="חיפוש..."
             [formControl]="searchControl">
    </mat-form-field>
    
    @if (searchService.isSearching() && !searchService.hasResults()) {
      <div class="no-results">אין תוצאות</div>
    }
    
    @for (result of searchService.searchResults(); track result.id) {
      <mat-card class="search-result">
        <mat-card-content>
          <h3>{{result.title}}</h3>
          <p>{{result.description}}</p>
        </mat-card-content>
      </mat-card>
    }
  `
})
export class SearchComponent implements OnInit {
  readonly searchControl = new FormControl('');
  protected readonly searchService = inject(SearchService);
  
  private readonly destroyRef = inject(DestroyRef);
  
  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(term => this.searchService.updateSearchTerm(term || ''));
  }
}
```

### **2. Advanced Observable Patterns**
```typescript
// ✅ טוב - Complex data flow
@Injectable({
  providedIn: 'root'
})
export class DataSyncService {
  private readonly http = inject(HttpClient);
  
  // WebSocket connection
  private readonly ws$ = new WebSocketSubject('ws://localhost:8080/data');
  
  // Polling for fallback
  private readonly polling$ = timer(0, 30000).pipe(
    switchMap(() => this.http.get<Data[]>('/api/data'))
  );
  
  // Real-time data stream
  readonly dataStream$ = merge(
    this.ws$.asObservable(),
    this.polling$
  ).pipe(
    retry({ delay: 5000, count: 3 }),
    shareReplay(1)
  );
  
  // Convert to signal
  readonly data = toSignal(this.dataStream$, { initialValue: [] });
  
  // Optimistic updates
  private readonly optimisticUpdates$ = new Subject<OptimisticUpdate>();
  
  readonly optimisticData = computed(() => {
    const baseData = this.data();
    const updates = this.optimisticUpdates$.value;
    
    return updates ? this.applyOptimisticUpdate(baseData, updates) : baseData;
  });
  
  updateData(id: string, update: Partial<Data>): Observable<Data> {
    // Optimistic update
    this.optimisticUpdates$.next({ type: 'update', id, data: update });
    
    return this.http.patch<Data>(`/api/data/${id}`, update).pipe(
      tap(() => {
        // Clear optimistic update on success
        this.optimisticUpdates$.next(null);
      }),
      catchError(error => {
        // Revert optimistic update on error
        this.optimisticUpdates$.next(null);
        return throwError(() => error);
      })
    );
  }
  
  private applyOptimisticUpdate(data: Data[], update: OptimisticUpdate): Data[] {
    if (update.type === 'update') {
      return data.map(item => 
        item.id === update.id ? { ...item, ...update.data } : item
      );
    }
    return data;
  }
}
```

---

## 🎨 Advanced UI Patterns

### **1. Dynamic Component Loading**
```typescript
// ✅ טוב - Dynamic components עם Signals
@Component({
  selector: 'app-dynamic-content',
  template: `
    <div class="dynamic-container">
      @for (config of componentConfigs(); track config.id) {
        <ng-container [ngComponentOutlet]="config.component" 
                      [ngComponentOutletInputs]="config.inputs">
        </ng-container>
      }
    </div>
  `
})
export class DynamicContentComponent {
  readonly componentConfigs = input.required<ComponentConfig[]>();
  
  // Dynamic component registry
  private readonly componentRegistry = new Map<string, Type<any>>([
    ['chart', ChartComponent],
    ['table', TableComponent],
    ['form', FormComponent]
  ]);
  
  readonly resolvedConfigs = computed(() => {
    return this.componentConfigs().map(config => ({
      ...config,
      component: this.componentRegistry.get(config.type) || DefaultComponent
    }));
  });
}
```

### **2. Advanced Form Patterns**
```typescript
// ✅ טוב - Reactive forms עם Signals
@Component({
  selector: 'app-advanced-form',
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      @for (field of formFields(); track field.key) {
        <div class="form-field">
          @switch (field.type) {
            @case ('text') {
              <mat-form-field>
                <mat-label>{{field.label}}</mat-label>
                <input matInput [formControlName]="field.key">
                @if (getFieldError(field.key); as error) {
                  <mat-error>{{error}}</mat-error>
                }
              </mat-form-field>
            }
            @case ('select') {
              <mat-form-field>
                <mat-label>{{field.label}}</mat-label>
                <mat-select [formControlName]="field.key">
                  @for (option of field.options; track option.value) {
                    <mat-option [value]="option.value">
                      {{option.label}}
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>
            }
            @case ('checkbox') {
              <mat-checkbox [formControlName]="field.key">
                {{field.label}}
              </mat-checkbox>
            }
          }
        </div>
      }
      
      <div class="form-actions">
        <button mat-raised-button 
                type="submit" 
                color="primary"
                [disabled]="form.invalid || isSubmitting()">
          @if (isSubmitting()) {
            <mat-spinner diameter="20"></mat-spinner>
            שולח...
          } @else {
            שלח
          }
        </button>
      </div>
    </form>
  `
})
export class AdvancedFormComponent implements OnInit {
  readonly formConfig = input.required<FormConfig>();
  readonly initialData = input<any>(null);
  
  readonly formSubmitted = output<any>();
  
  readonly form = new FormGroup({});
  readonly isSubmitting = signal<boolean>(false);
  
  readonly formFields = computed(() => this.formConfig().fields);
  
  readonly formValue = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.value)),
    { initialValue: {} }
  );
  
  ngOnInit(): void {
    this.buildForm();
    this.setupValidation();
  }
  
  private buildForm(): void {
    const config = this.formConfig();
    const initialData = this.initialData();
    
    config.fields.forEach(field => {
      const validators = this.buildValidators(field);
      const initialValue = initialData?.[field.key] || field.defaultValue || '';
      
      this.form.addControl(
        field.key,
        new FormControl(initialValue, validators)
      );
    });
  }
  
  private buildValidators(field: FormField): ValidatorFn[] {
    const validators: ValidatorFn[] = [];
    
    if (field.required) validators.push(Validators.required);
    if (field.minLength) validators.push(Validators.minLength(field.minLength));
    if (field.maxLength) validators.push(Validators.maxLength(field.maxLength));
    if (field.pattern) validators.push(Validators.pattern(field.pattern));
    if (field.email) validators.push(Validators.email);
    
    return validators;
  }
  
  private setupValidation(): void {
    // Cross-field validation
    const config = this.formConfig();
    if (config.crossFieldValidation) {
      this.form.setValidators(this.crossFieldValidator.bind(this));
    }
  }
  
  private crossFieldValidator(form: AbstractControl): ValidationErrors | null {
    const config = this.formConfig();
    const rules = config.crossFieldValidation || [];
    
    for (const rule of rules) {
      const field1Value = form.get(rule.field1)?.value;
      const field2Value = form.get(rule.field2)?.value;
      
      if (rule.type === 'match' && field1Value !== field2Value) {
        return { [rule.errorKey]: true };
      }
    }
    
    return null;
  }
  
  getFieldError(fieldKey: string): string | null {
    const control = this.form.get(fieldKey);
    if (!control || !control.errors || !control.touched) return null;
    
    const errors = control.errors;
    const field = this.formFields().find(f => f.key === fieldKey);
    
    if (errors['required']) return `${field?.label} הוא שדה חובה`;
    if (errors['email']) return 'כתובת אימייל לא תקינה';
    if (errors['minlength']) return `מינימום ${errors['minlength'].requiredLength} תווים`;
    if (errors['maxlength']) return `מקסימום ${errors['maxlength'].requiredLength} תווים`;
    
    return 'שגיאה בשדה';
  }
  
  onSubmit(): void {
    if (this.form.valid) {
      this.isSubmitting.set(true);
      this.formSubmitted.emit(this.form.value);
    } else {
      this.form.markAllAsTouched();
    }
  }
}
```

---

## 🎯 סיכום כללים מתקדמים

### **כללים אלו מיועדים לפרויקטים מתקדמים ומשלימים את הכללים הבסיסיים:**

1. **🆕 Angular 19 Features** - השתמש בכל החידושים החדשים
2. **⚡ Advanced Signals** - patterns מתקדמים לניהול state
3. **🏗️ Architecture** - Smart/Dumb components, Feature stores
4. **🔄 RxJS Integration** - שילוב מתקדם עם Signals
5. **🎨 Dynamic UI** - קומפוננטים דינמיים וטפסים מתקדמים

### **השתמש בקבצים יחד:**
- `angular-base-rules.md` - כללי יסוד (חובה)
- `angular-advanced-rules.md` - תכונות מתקדמות (לפי הצורך)

**שני הקבצים יחד מספקים מדריך מלא לפיתוח Angular מקצועי! 🚀**