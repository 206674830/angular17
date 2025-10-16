# Angular 19 Coding Rules & Best Practices

## 🚀 מדריך מקיף לפיתוח עם Angular 19

### 📋 תוכן עניינים
1. [חידושי Angular 19](#חידושי-angular-19)
2. [כללי קוד כלליים](#כללי-קוד-כלליים)
3. [Standalone Components](#standalone-components)
4. [Signals & Reactive Programming](#signals--reactive-programming)
5. [Control Flow Syntax](#control-flow-syntax)
6. [Dependency Injection](#dependency-injection)
7. [Performance & Optimization](#performance--optimization)
8. [Security & Accessibility](#security--accessibility)
9. [Testing](#testing)
10. [File Structure](#file-structure)

---

## 🆕 חידושי Angular 19

### 1. **Event Replay (SSR Enhancement)**
```typescript
// ✅ טוב - שימוש ב-Event Replay עבור SSR
import { bootstrapApplication } from '@angular/platform-browser';
import { withEventReplay } from '@angular/platform-browser';

bootstrapApplication(AppComponent, {
  providers: [
    provideClientHydration(withEventReplay())
  ]
});
```

### 2. **Incremental Hydration**
```typescript
// ✅ טוב - Hydration מדורג
@Component({
  selector: 'app-heavy-component',
  template: `
    @defer (on viewport) {
      <heavy-chart [data]="chartData()"></heavy-chart>
    } @placeholder {
      <div class="skeleton-loader"></div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeavyComponent {
  readonly chartData = signal<ChartData[]>([]);
}
```

### 3. **Material 3 Design System**
```typescript
// ✅ טוב - שימוש ב-Material 3
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';

@Component({
  providers: [
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline', subscriptSizing: 'dynamic' }
    }
  ]
})
export class FormComponent {}
```

### 4. **Built-in Control Flow**
```html
<!-- ✅ טוב - Control Flow החדש -->
@if (user(); as currentUser) {
  <div class="user-profile">
    <h2>{{currentUser.name}}</h2>
    @if (currentUser.isAdmin) {
      <admin-panel></admin-panel>
    }
  </div>
} @else {
  <login-form></login-form>
}

@for (item of items(); track item.id) {
  <mat-card class="item-card">
    <mat-card-content>{{item.title}}</mat-card-content>
  </mat-card>
} @empty {
  <div class="empty-state">
    <mat-icon>inbox</mat-icon>
    <p>אין פריטים להצגה</p>
  </div>
}

@switch (status()) {
  @case ('loading') {
    <mat-spinner></mat-spinner>
  }
  @case ('error') {
    <mat-error>שגיאה בטעינת הנתונים</mat-error>
  }
  @case ('success') {
    <data-display [data]="data()"></data-display>
  }
}
```

---

## 📝 כללי קוד כלליים

### **Naming Conventions**
```typescript
// ✅ טוב
// Files: kebab-case
user-profile.component.ts
user-management.service.ts
auth.guard.ts

// Classes: PascalCase
export class UserProfileComponent {}
export class UserManagementService {}
export class AuthGuard {}

// Variables/Methods: camelCase
const isUserLoggedIn = signal<boolean>(false);
const getUserPermissions = () => {};

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_ATTEMPTS = 3;

// Interfaces: PascalCase with 'I' prefix (optional)
interface User {
  readonly id: string;
  readonly email: string;
}

// Types: PascalCase
type UserRole = 'admin' | 'user' | 'guest';
```

### **Import Order**
```typescript
// 1. Angular core imports
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// 2. Angular Material imports
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

// 3. RxJS imports
import { Observable, map, filter, catchError } from 'rxjs';

// 4. Third-party libraries
import { NgxSpinnerModule } from 'ngx-spinner';

// 5. Application imports
import { UserService } from '@core/services/user.service';
import { AuthGuard } from '@core/guards/auth.guard';

// 6. Relative imports
import { UserCardComponent } from './user-card/user-card.component';
import { User } from './models/user.interface';
```

---

## 🔧 Standalone Components

### **Component Structure**
```typescript
// ✅ טוב - Standalone Component עם Angular 19
@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule
  ],
  templateUrl: './user-profile.component.html',
  styleUrl: './user-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserProfileComponent implements OnInit {
  // Signals for reactive state
  readonly user = signal<User | null>(null);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  
  // Computed signals
  readonly fullName = computed(() => {
    const currentUser = this.user();
    return currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : '';
  });
  
  readonly canEdit = computed(() => {
    const currentUser = this.user();
    return currentUser?.permissions.includes('edit') ?? false;
  });
  
  // Service injection
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  
  ngOnInit(): void {
    this.loadUserProfile();
  }
  
  private loadUserProfile(): void {
    this.isLoading.set(true);
    this.error.set(null);
    
    this.userService.getCurrentUser()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(error => {
          this.error.set('שגיאה בטעינת פרופיל המשתמש');
          return EMPTY;
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe(user => this.user.set(user));
  }
  
  protected readonly trackByUserId = (index: number, user: User): string => user.id;
}
```

### **Template Structure**
```html
<!-- user-profile.component.html -->
<div class="user-profile-container">
  @if (isLoading()) {
    <div class="loading-container">
      <mat-spinner diameter="40"></mat-spinner>
      <p>טוען פרופיל...</p>
    </div>
  } @else if (error()) {
    <mat-card class="error-card">
      <mat-card-content>
        <mat-icon color="warn">error</mat-icon>
        <p>{{error()}}</p>
        <button mat-raised-button color="primary" (click)="loadUserProfile()">
          נסה שוב
        </button>
      </mat-card-content>
    </mat-card>
  } @else if (user(); as currentUser) {
    <mat-card class="profile-card">
      <mat-card-header>
        <mat-card-title>{{fullName()}}</mat-card-title>
        <mat-card-subtitle>{{currentUser.email}}</mat-card-subtitle>
      </mat-card-header>
      
      <mat-card-content>
        <div class="user-details">
          <p><strong>תפקיד:</strong> {{currentUser.role}}</p>
          <p><strong>תאריך הצטרפות:</strong> {{currentUser.createdAt | date:'dd/MM/yyyy'}}</p>
        </div>
        
        @if (currentUser.permissions.length > 0) {
          <div class="permissions-section">
            <h3>הרשאות:</h3>
            <mat-chip-set>
              @for (permission of currentUser.permissions; track permission) {
                <mat-chip>{{permission}}</mat-chip>
              }
            </mat-chip-set>
          </div>
        }
      </mat-card-content>
      
      <mat-card-actions>
        @if (canEdit()) {
          <button mat-raised-button color="primary" (click)="editProfile()">
            <mat-icon>edit</mat-icon>
            ערוך פרופיל
          </button>
        }
        <button mat-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
          חזור
        </button>
      </mat-card-actions>
    </mat-card>
  }
</div>
```

---

## ⚡ Signals & Reactive Programming

### **Signal Best Practices**
```typescript
// ✅ טוב - שימוש נכון ב-Signals
@Injectable({
  providedIn: 'root'
})
export class UserStateService {
  // Private writable signals
  private readonly _users = signal<User[]>([]);
  private readonly _selectedUserId = signal<string | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  
  // Public readonly signals
  readonly users = this._users.asReadonly();
  readonly selectedUserId = this._selectedUserId.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  
  // Computed signals
  readonly selectedUser = computed(() => {
    const id = this._selectedUserId();
    return id ? this._users().find(user => user.id === id) ?? null : null;
  });
  
  readonly userCount = computed(() => this._users().length);
  
  readonly sortedUsers = computed(() => 
    [...this._users()].sort((a, b) => a.name.localeCompare(b.name))
  );
  
  // Effects
  private readonly logUserSelection = effect(() => {
    const selectedUser = this.selectedUser();
    if (selectedUser) {
      console.log(`Selected user: ${selectedUser.name}`);
    }
  });
  
  // Methods
  addUser(user: User): void {
    this._users.update(users => [...users, user]);
  }
  
  removeUser(id: string): void {
    this._users.update(users => users.filter(user => user.id !== id));
  }
  
  selectUser(id: string): void {
    this._selectedUserId.set(id);
  }
  
  setLoading(loading: boolean): void {
    this._isLoading.set(loading);
  }
}
```

### **Signal Integration with RxJS**
```typescript
// ✅ טוב - שילוב Signals עם RxJS
@Component({
  selector: 'app-search',
  template: `
    <mat-form-field>
      <input matInput 
             placeholder="חיפוש משתמשים"
             [formControl]="searchControl">
    </mat-form-field>
    
    @for (user of filteredUsers(); track user.id) {
      <user-card [user]="user"></user-card>
    } @empty {
      <div class="no-results">לא נמצאו תוצאות</div>
    }
  `
})
export class SearchComponent implements OnInit {
  readonly searchControl = new FormControl('');
  
  private readonly allUsers = signal<User[]>([]);
  private readonly searchTerm = signal<string>('');
  
  readonly filteredUsers = computed(() => {
    const term = this.searchTerm().toLowerCase();
    return this.allUsers().filter(user => 
      user.name.toLowerCase().includes(term) ||
      user.email.toLowerCase().includes(term)
    );
  });
  
  private readonly userService = inject(UserService);
  private readonly destroyRef = inject(DestroyRef);
  
  ngOnInit(): void {
    // Convert FormControl to Signal
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(term => this.searchTerm.set(term || ''));
    
    // Load initial data
    this.loadUsers();
  }
  
  private loadUsers(): void {
    this.userService.getUsers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(users => this.allUsers.set(users));
  }
}
```

---

## 🎯 Control Flow Syntax

### **Conditional Rendering**
```html
<!-- ✅ טוב - Control Flow החדש -->
@if (userRole() === 'admin'; as role) {
  <admin-dashboard [role]="role"></admin-dashboard>
} @else if (userRole() === 'moderator') {
  <moderator-panel></moderator-panel>
} @else {
  <user-dashboard></user-dashboard>
}

<!-- עם alias -->
@if (currentUser(); as user) {
  <div class="welcome-message">
    שלום {{user.firstName}}!
  </div>
}
```

### **Loops with Track**
```html
<!-- ✅ טוב - Loop עם track function -->
@for (product of products(); track product.id; let i = $index, isFirst = $first, isLast = $last) {
  <mat-card [class.first-item]="isFirst" [class.last-item]="isLast">
    <mat-card-header>
      <mat-card-title>{{i + 1}}. {{product.name}}</mat-card-title>
    </mat-card-header>
    <mat-card-content>
      <p>{{product.description}}</p>
      <p class="price">₪{{product.price}}</p>
    </mat-card-content>
  </mat-card>
} @empty {
  <div class="empty-state">
    <mat-icon>shopping_cart</mat-icon>
    <h3>אין מוצרים</h3>
    <p>לא נמצאו מוצרים להצגה</p>
    <button mat-raised-button color="primary" (click)="loadProducts()">
      רענן רשימה
    </button>
  </div>
}
```

### **Switch Statements**
```html
<!-- ✅ טוב - Switch statement -->
@switch (orderStatus()) {
  @case ('pending') {
    <mat-chip color="warn">
      <mat-icon>schedule</mat-icon>
      ממתין לאישור
    </mat-chip>
  }
  @case ('processing') {
    <mat-chip color="accent">
      <mat-icon>autorenew</mat-icon>
      בעיבוד
    </mat-chip>
  }
  @case ('shipped') {
    <mat-chip color="primary">
      <mat-icon>local_shipping</mat-icon>
      נשלח
    </mat-chip>
  }
  @case ('delivered') {
    <mat-chip color="primary">
      <mat-icon>check_circle</mat-icon>
      נמסר
    </mat-chip>
  }
  @default {
    <mat-chip>
      <mat-icon>help</mat-icon>
      לא ידוע
    </mat-chip>
  }
}
```

---

## 💉 Dependency Injection

### **Modern DI with inject()**
```typescript
// ✅ טוב - שימוש ב-inject()
@Component({
  selector: 'app-product-list'
})
export class ProductListComponent {
  // Service injection
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);
  private readonly snackBar = inject(MatSnackBar);
  
  // Router injection
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  
  // Lifecycle management
  private readonly destroyRef = inject(DestroyRef);
  
  // Optional injection
  private readonly analytics = inject(AnalyticsService, { optional: true });
  
  // Injection with custom token
  private readonly config = inject(APP_CONFIG);
  
  addToCart(product: Product): void {
    this.cartService.addItem(product);
    
    this.snackBar.open('המוצר נוסף לעגלה', 'סגור', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top'
    });
    
    // Optional analytics tracking
    this.analytics?.trackEvent('add_to_cart', {
      product_id: product.id,
      product_name: product.name
    });
  }
}
```

### **Custom Injection Tokens**
```typescript
// ✅ טוב - Custom injection tokens
export const APP_CONFIG = new InjectionToken<AppConfig>('app.config');
export const API_BASE_URL = new InjectionToken<string>('api.base.url');

// Provider configuration
export const appConfigProvider = {
  provide: APP_CONFIG,
  useValue: {
    apiUrl: environment.apiUrl,
    appName: 'My Angular App',
    version: '1.0.0'
  }
};

// Usage in component
@Component({
  selector: 'app-header'
})
export class HeaderComponent {
  private readonly config = inject(APP_CONFIG);
  
  readonly appName = this.config.appName;
  readonly version = this.config.version;
}
```

---

## 🚀 Performance & Optimization

### **OnPush Strategy with Signals**
```typescript
// ✅ טוב - OnPush עם Signals
@Component({
  selector: 'app-product-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="product-card">
      <mat-card-header>
        <mat-card-title>{{product().name}}</mat-card-title>
        <mat-card-subtitle>{{product().category}}</mat-card-subtitle>
      </mat-card-header>
      
      <img mat-card-image 
           [ngSrc]="product().imageUrl" 
           [alt]="product().name"
           width="300" 
           height="200"
           priority>
      
      <mat-card-content>
        <p>{{product().description}}</p>
        <p class="price">₪{{formattedPrice()}}</p>
      </mat-card-content>
      
      <mat-card-actions>
        <button mat-raised-button 
                color="primary"
                [disabled]="!product().inStock"
                (click)="addToCart.emit(product())">
          {{product().inStock ? 'הוסף לעגלה' : 'אזל במלאי'}}
        </button>
      </mat-card-actions>
    </mat-card>
  `
})
export class ProductCardComponent {
  readonly product = input.required<Product>();
  readonly addToCart = output<Product>();
  
  readonly formattedPrice = computed(() => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(this.product().price);
  });
}
```

### **Deferrable Views**
```html
<!-- ✅ טוב - Deferrable views לביצועים -->
<div class="page-content">
  <!-- Content above the fold -->
  <hero-section></hero-section>
  
  <!-- Defer heavy components -->
  @defer (on viewport) {
    <heavy-chart [data]="chartData()"></heavy-chart>
  } @placeholder {
    <div class="chart-skeleton">
      <mat-progress-bar mode="indeterminate"></mat-progress-bar>
      <p>טוען גרף...</p>
    </div>
  } @loading (minimum 500ms) {
    <mat-spinner diameter="40"></mat-spinner>
  } @error {
    <mat-card class="error-card">
      <mat-card-content>
        <mat-icon color="warn">error</mat-icon>
        <p>שגיאה בטעינת הגרף</p>
      </mat-card-content>
    </mat-card>
  }
  
  <!-- Defer on interaction -->
  @defer (on interaction) {
    <comments-section [postId]="postId()"></comments-section>
  } @placeholder {
    <button mat-stroked-button>טען תגובות</button>
  }
  
  <!-- Defer on timer -->
  @defer (on timer(2s)) {
    <newsletter-signup></newsletter-signup>
  }
</div>
```

### **Image Optimization**
```html
<!-- ✅ טוב - NgOptimizedImage -->
<img [ngSrc]="product.imageUrl" 
     [alt]="product.name"
     width="400" 
     height="300"
     [priority]="isAboveFold"
     [placeholder]="imagePlaceholder"
     sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw">
```

---

## 🔒 Security & Accessibility

### **Safe HTML Handling**
```typescript
// ✅ טוב - Safe HTML with sanitization
@Component({
  template: `
    <div [innerHTML]="sanitizedContent()"></div>
  `
})
export class ContentComponent {
  readonly rawContent = input<string>('');
  
  private readonly sanitizer = inject(DomSanitizer);
  
  readonly sanitizedContent = computed(() => {
    const content = this.rawContent();
    return this.sanitizer.sanitize(SecurityContext.HTML, content) || '';
  });
}
```

### **Accessibility Best Practices**
```html
<!-- ✅ טוב - נגישות מלאה -->
<form [formGroup]="userForm" (ngSubmit)="onSubmit()" novalidate>
  <mat-form-field appearance="outline">
    <mat-label>שם מלא</mat-label>
    <input matInput 
           formControlName="fullName"
           required
           [attr.aria-describedby]="fullNameErrors ? 'fullName-error' : null">
    <mat-error id="fullName-error" *ngIf="fullNameErrors">
      {{fullNameErrors}}
    </mat-error>
  </mat-form-field>
  
  <mat-form-field appearance="outline">
    <mat-label>אימייל</mat-label>
    <input matInput 
           type="email"
           formControlName="email"
           required
           [attr.aria-describedby]="emailErrors ? 'email-error' : null">
    <mat-error id="email-error" *ngIf="emailErrors">
      {{emailErrors}}
    </mat-error>
  </mat-form-field>
  
  <button mat-raised-button 
          type="submit"
          color="primary"
          [disabled]="userForm.invalid || isSubmitting()"
          [attr.aria-label]="isSubmitting() ? 'שולח טופס...' : 'שלח טופס'">
    @if (isSubmitting()) {
      <mat-spinner diameter="20" aria-hidden="true"></mat-spinner>
      שולח...
    } @else {
      שלח
    }
  </button>
</form>

<!-- Skip navigation -->
<a class="skip-link" href="#main-content">דלג לתוכן הראשי</a>

<!-- Proper heading hierarchy -->
<main id="main-content">
  <h1>כותרת ראשית</h1>
  <section>
    <h2>כותרת משנה</h2>
    <h3>כותרת רמה שלישית</h3>
  </section>
</main>

<!-- ARIA landmarks -->
<nav aria-label="ניווט ראשי">
  <ul role="menubar">
    <li role="none">
      <a role="menuitem" href="/home">בית</a>
    </li>
  </ul>
</nav>
```

---

## 🧪 Testing

### **Component Testing with Signals**
```typescript
// ✅ טוב - בדיקות קומפוננט עם Signals
describe('UserProfileComponent', () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;
  let userService: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getCurrentUser']);

    await TestBed.configureTestingModule({
      imports: [
        UserProfileComponent,
        MatCardModule,
        MatButtonModule,
        MatSpinnerModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: UserService, useValue: userServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
  });

  describe('user loading', () => {
    it('should show loading spinner when loading user', () => {
      // Arrange
      userService.getCurrentUser.and.returnValue(new Subject());
      component.isLoading.set(true);

      // Act
      fixture.detectChanges();

      // Assert
      const spinner = fixture.debugElement.query(By.css('mat-spinner'));
      expect(spinner).toBeTruthy();
      expect(component.isLoading()).toBe(true);
    });

    it('should display user information when loaded', () => {
      // Arrange
      const mockUser: User = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'user',
        permissions: ['read'],
        createdAt: new Date()
      };
      
      userService.getCurrentUser.and.returnValue(of(mockUser));
      
      // Act
      component.ngOnInit();
      fixture.detectChanges();

      // Assert
      expect(component.user()).toEqual(mockUser);
      expect(component.fullName()).toBe('John Doe');
      
      const titleElement = fixture.debugElement.query(By.css('mat-card-title'));
      expect(titleElement.nativeElement.textContent.trim()).toBe('John Doe');
    });
  });

  describe('computed signals', () => {
    it('should compute full name correctly', () => {
      // Arrange
      const user: User = {
        id: '1',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        role: 'admin',
        permissions: ['read', 'write', 'edit'],
        createdAt: new Date()
      };

      // Act
      component.user.set(user);

      // Assert
      expect(component.fullName()).toBe('Jane Smith');
      expect(component.canEdit()).toBe(true);
    });

    it('should return empty string for null user', () => {
      // Act
      component.user.set(null);

      // Assert
      expect(component.fullName()).toBe('');
      expect(component.canEdit()).toBe(false);
    });
  });
});
```

### **Service Testing**
```typescript
// ✅ טוב - בדיקות שירות
describe('UserStateService', () => {
  let service: UserStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserStateService);
  });

  describe('user management', () => {
    it('should add user correctly', () => {
      // Arrange
      const newUser: User = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com'
      };

      // Act
      service.addUser(newUser);

      // Assert
      expect(service.users()).toContain(newUser);
      expect(service.userCount()).toBe(1);
    });

    it('should remove user correctly', () => {
      // Arrange
      const user1: User = { id: '1', name: 'John', email: 'john@example.com' };
      const user2: User = { id: '2', name: 'Jane', email: 'jane@example.com' };
      
      service.addUser(user1);
      service.addUser(user2);

      // Act
      service.removeUser('1');

      // Assert
      expect(service.users()).not.toContain(user1);
      expect(service.users()).toContain(user2);
      expect(service.userCount()).toBe(1);
    });

    it('should select user correctly', () => {
      // Arrange
      const user: User = { id: '1', name: 'John', email: 'john@example.com' };
      service.addUser(user);

      // Act
      service.selectUser('1');

      // Assert
      expect(service.selectedUserId()).toBe('1');
      expect(service.selectedUser()).toEqual(user);
    });
  });

  describe('computed signals', () => {
    it('should sort users alphabetically', () => {
      // Arrange
      const users: User[] = [
        { id: '1', name: 'Zebra', email: 'z@example.com' },
        { id: '2', name: 'Alpha', email: 'a@example.com' },
        { id: '3', name: 'Beta', email: 'b@example.com' }
      ];

      // Act
      users.forEach(user => service.addUser(user));

      // Assert
      const sortedUsers = service.sortedUsers();
      expect(sortedUsers[0].name).toBe('Alpha');
      expect(sortedUsers[1].name).toBe('Beta');
      expect(sortedUsers[2].name).toBe('Zebra');
    });
  });
});
```

---

## 📁 File Structure

### **Recommended Project Structure**
```
src/
├── app/
│   ├── core/                          # Core functionality (singletons)
│   │   ├── guards/
│   │   │   ├── auth.guard.ts
│   │   │   └── role.guard.ts
│   │   ├── interceptors/
│   │   │   ├── auth.interceptor.ts
│   │   │   ├── error.interceptor.ts
│   │   │   └── loading.interceptor.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── api.service.ts
│   │   │   └── notification.service.ts
│   │   └── models/
│   │       ├── user.interface.ts
│   │       ├── api-response.interface.ts
│   │       └── auth.types.ts
│   │
│   ├── shared/                        # Shared components and utilities
│   │   ├── components/
│   │   │   ├── loading-spinner/
│   │   │   │   ├── loading-spinner.component.ts
│   │   │   │   ├── loading-spinner.component.html
│   │   │   │   └── loading-spinner.component.scss
│   │   │   ├── confirmation-dialog/
│   │   │   └── error-message/
│   │   ├── directives/
│   │   │   ├── highlight.directive.ts
│   │   │   └── auto-focus.directive.ts
│   │   ├── pipes/
│   │   │   ├── safe-html.pipe.ts
│   │   │   └── truncate.pipe.ts
│   │   └── utils/
│   │       ├── form-validators.ts
│   │       └── date-utils.ts
│   │
│   ├── features/                      # Feature modules
│   │   ├── user-management/
│   │   │   ├── components/
│   │   │   │   ├── user-list/
│   │   │   │   │   ├── user-list.component.ts
│   │   │   │   │   ├── user-list.component.html
│   │   │   │   │   └── user-list.component.scss
│   │   │   │   ├── user-form/
│   │   │   │   └── user-card/
│   │   │   ├── services/
│   │   │   │   └── user.service.ts
│   │   │   ├── models/
│   │   │   │   └── user.interface.ts
│   │   │   └── user-management.routes.ts
│   │   │
│   │   ├── product-catalog/
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   ├── models/
│   │   │   └── product-catalog.routes.ts
│   │   │
│   │   └── dashboard/
│   │       ├── components/
│   │       ├── services/
│   │       └── dashboard.routes.ts
│   │
│   ├── layout/                        # Layout components
│   │   ├── header/
│   │   ├── sidebar/
│   │   ├── footer/
│   │   └── main-layout/
│   │
│   ├── app.component.ts
│   ├── app.component.html
│   ├── app.component.scss
│   ├── app.config.ts
│   └── app.routes.ts
│
├── assets/                            # Static assets
│   ├── images/
│   ├── icons/
│   ├── i18n/
│   └── styles/
│       ├── _variables.scss
│       ├── _mixins.scss
│       └── themes/
│
├── environments/
│   ├── environment.ts
│   └── environment.prod.ts
│
└── styles.scss                       # Global styles
```

---

## ⚙️ Configuration Files

### **ESLint Configuration (.eslintrc.json)**
```json
{
  "root": true,
  "ignorePatterns": ["projects/**/*"],
  "overrides": [
    {
      "files": ["*.ts"],
      "extends": [
        "eslint:recommended",
        "@typescript-eslint/recommended",
        "@angular-eslint/recommended",
        "@angular-eslint/template/process-inline-templates"
      ],
      "rules": {
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/prefer-readonly": "error",
        "@typescript-eslint/no-unused-vars": "error",
        "@angular-eslint/component-class-suffix": "error",
        "@angular-eslint/directive-class-suffix": "error",
        "@angular-eslint/no-input-rename": "error",
        "@angular-eslint/prefer-on-push-component-change-detection": "warn",
        "@angular-eslint/use-injectable-provided-in": "error",
        "@angular-eslint/no-output-on-prefix": "error",
        "@angular-eslint/use-lifecycle-interface": "error",
        "@angular-eslint/component-selector": [
          "error",
          {
            "type": "element",
            "prefix": "app",
            "style": "kebab-case"
          }
        ],
        "@angular-eslint/directive-selector": [
          "error",
          {
            "type": "attribute",
            "prefix": "app",
            "style": "camelCase"
          }
        ]
      }
    },
    {
      "files": ["*.html"],
      "extends": ["@angular-eslint/template/recommended"],
      "rules": {
        "@angular-eslint/template/no-negated-async": "error",
        "@angular-eslint/template/use-track-by-function": "error",
        "@angular-eslint/template/accessibility-alt-text": "error",
        "@angular-eslint/template/accessibility-elements-content": "error",
        "@angular-eslint/template/accessibility-label-has-associated-control": "error"
      }
    }
  ]
}
```

### **TypeScript Configuration (tsconfig.json)**
```json
{
  "compileOnSave": false,
  "compilerOptions": {
    "baseUrl": "./",
    "outDir": "./dist/out-tsc",
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "sourceMap": true,
    "declaration": false,
    "downlevelIteration": true,
    "experimentalDecorators": true,
    "moduleResolution": "node",
    "importHelpers": true,
    "target": "ES2022",
    "module": "ES2022",
    "useDefineForClassFields": false,
    "lib": ["ES2022", "dom"],
    "paths": {
      "@core/*": ["src/app/core/*"],
      "@shared/*": ["src/app/shared/*"],
      "@features/*": ["src/app/features/*"],
      "@layout/*": ["src/app/layout/*"],
      "@environments/*": ["src/environments/*"]
    }
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true,
    "strictInputTypes": true
  }
}
```

### **Prettier Configuration (.prettierrc)**
```json
{
  "singleQuote": true,
  "trailingComma": "es5",
  "tabWidth": 2,
  "semi": true,
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "htmlWhitespaceSensitivity": "css",
  "overrides": [
    {
      "files": "*.html",
      "options": {
        "parser": "angular"
      }
    }
  ]
}
```

---

## 🎯 סיכום

### **עקרונות מנחים לפיתוח עם Angular 19:**

1. **🚀 השתמש בחידושים החדשים** - Control Flow, Event Replay, Material 3
2. **⚡ Signals First** - העדף Signals על פני RxJS למצב מקומי
3. **🧩 Standalone Components** - השתמש בקומפוננטים עצמאיים
4. **🎯 OnPush Strategy** - תמיד עם ChangeDetectionStrategy.OnPush
5. **💉 Modern DI** - השתמש ב-inject() במקום constructor injection
6. **🔒 Type Safety** - הימנע מ-any, השתמש בממשקים מפורטים
7. **♿ נגישות** - תמיד חשוב על נגישות מהתחלה
8. **🧪 Testing** - כתוב בדיקות לכל קומפוננט ושירות
9. **📁 מבנה ברור** - ארגן את הקוד בצורה הגיונית
10. **⚡ ביצועים** - השתמש ב-deferrable views ו-trackBy functions

### **זכור:**
- **קוד צריך להיות קריא** - שמות משתנים ופונקציות תיאוריים
- **עקביות היא המפתח** - עקוב אחר הכללים בכל הפרויקט  
- **ביצועים חשובים** - תמיד חשוב על Core Web Vitals
- **נגישות לא אופציונלית** - כל משתמש צריך לוכל להשתמש באפליקציה
- **אבטחה קודמת לכל** - תמיד sanitize תוכן דינמי

---

**מדריך זה מכסה את כל ה-best practices העדכניים לפיתוח עם Angular 19. עקוב אחר הכללים האלה כדי לבנות אפליקציות איכותיות, מתוחזקות וסקלביליות! 🎉**