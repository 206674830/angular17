# Angular Base Rules - כללי יסוד

## 🎯 מטרת הקובץ
קובץ זה מכיל את הכללים הבסיסיים והאוניברסליים לכל פרויקט Angular. 
כללים אלו חלים על כל קומפוננט, שירות ומודול באפליקציה.

---

## 📝 כללי קוד בסיסיים

### **1. Naming Conventions**
```typescript
// ✅ Files: kebab-case
user-profile.component.ts
auth.service.ts
product-list.component.html

// ✅ Classes: PascalCase
export class UserProfileComponent {}
export class AuthService {}

// ✅ Variables/Methods: camelCase
const isUserAuthenticated = signal<boolean>(false);
const getCurrentUser = () => {};

// ✅ Constants: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';
const DEFAULT_TIMEOUT = 5000;

// ✅ Interfaces: PascalCase
interface User {
  readonly id: string;
  readonly email: string;
}

// ✅ Types: PascalCase
type UserRole = 'admin' | 'user' | 'guest';
```

### **2. Import Order (חובה)**
```typescript
// 1. Angular core imports
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

// 2. Angular Material imports
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

// 3. RxJS imports
import { Observable, map, filter } from 'rxjs';

// 4. Third-party libraries
import { NgxSpinnerModule } from 'ngx-spinner';

// 5. Application core imports
import { UserService } from '@core/services/user.service';

// 6. Relative imports
import { UserCardComponent } from './user-card/user-card.component';
```

### **3. Component Structure (חובה)**
```typescript
@Component({
  selector: 'app-component-name',        // חובה: app- prefix
  standalone: true,                     // חובה: standalone components
  imports: [/* modules */],             // חובה: רק מה שנדרש
  templateUrl: './component.html',      // חובה: קובץ נפרד
  styleUrl: './component.scss',         // חובה: קובץ נפרד
  changeDetection: ChangeDetectionStrategy.OnPush  // חובה
})
export class ComponentNameComponent {
  // 1. Signals (readonly public)
  readonly data = signal<Data[]>([]);
  
  // 2. Computed signals
  readonly computedValue = computed(() => this.data().length);
  
  // 3. Services (private readonly)
  private readonly service = inject(ServiceName);
  
  // 4. Lifecycle methods
  ngOnInit(): void {}
  
  // 5. Public methods
  public handleAction(): void {}
  
  // 6. Private methods
  private helperMethod(): void {}
  
  // 7. TrackBy functions (protected readonly)
  protected readonly trackById = (index: number, item: any): string => item.id;
}
```

---

## 🔧 TypeScript Rules

### **1. Type Safety (חובה)**
```typescript
// ✅ טוב - מפורט ובטוח
interface ApiResponse<T> {
  readonly success: boolean;
  readonly data: T;
  readonly message?: string;
  readonly timestamp: Date;
}

interface User {
  readonly id: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly role: UserRole;
  readonly permissions: readonly Permission[];
}

// ❌ רע - לא ספציפי
interface ApiResponse {
  data: any;
  success: boolean;
}
```

### **2. Error Handling (חובה)**
```typescript
// ✅ טוב - error handling מובנה
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  
  getUser(id: string): Observable<User> {
    return this.http.get<User>(`/api/users/${id}`).pipe(
      catchError(error => {
        console.error('Failed to fetch user:', error);
        return throwError(() => new Error('שגיאה בטעינת משתמש'));
      })
    );
  }
}
```

### **3. Immutability (חובה)**
```typescript
// ✅ טוב - immutable patterns
@Injectable({
  providedIn: 'root'
})
export class StateService {
  private readonly _items = signal<readonly Item[]>([]);
  readonly items = this._items.asReadonly();
  
  addItem(item: Item): void {
    this._items.update(current => [...current, item]);
  }
  
  removeItem(id: string): void {
    this._items.update(current => current.filter(item => item.id !== id));
  }
}

// ❌ רע - mutation
addItem(item: Item): void {
  this._items().push(item); // מוטציה!
}
```

---

## ⚡ Performance Rules

### **1. OnPush Strategy (חובה)**
```typescript
// ✅ חובה בכל קומפוננט
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyComponent {}
```

### **2. TrackBy Functions (חובה ב-ngFor)**
```html
<!-- ✅ טוב -->
@for (item of items(); track item.id) {
  <div>{{item.name}}</div>
}

<!-- ❌ רע - ללא track -->
@for (item of items()) {
  <div>{{item.name}}</div>
}
```

### **3. Signals Over RxJS (מומלץ למצב מקומי)**
```typescript
// ✅ טוב - signals למצב מקומי
readonly isLoading = signal<boolean>(false);
readonly error = signal<string | null>(null);

// ✅ טוב - RxJS לתקשורת עם שרת
readonly users$ = this.userService.getUsers();
```

---

## 🔒 Security Rules

### **1. Input Sanitization (חובה)**
```typescript
// ✅ טוב - sanitization
@Component({
  template: `<div [innerHTML]="sanitizedContent()"></div>`
})
export class SafeComponent {
  private readonly sanitizer = inject(DomSanitizer);
  
  readonly sanitizedContent = computed(() => {
    const content = this.rawContent();
    return this.sanitizer.sanitize(SecurityContext.HTML, content) || '';
  });
}
```

### **2. No Direct DOM Manipulation (חובה)**
```typescript
// ❌ רע - DOM manipulation ישיר
document.getElementById('myElement').innerHTML = 'content';

// ✅ טוב - Angular way
@Component({
  template: `<div [innerHTML]="content()"></div>`
})
export class SafeComponent {
  readonly content = signal<string>('');
}
```

---

## ♿ Accessibility Rules

### **1. Semantic HTML (חובה)**
```html
<!-- ✅ טוב -->
<button mat-raised-button (click)="submit()">שלח</button>
<nav aria-label="ניווט ראשי">
  <ul>
    <li><a href="/home">בית</a></li>
  </ul>
</nav>

<!-- ❌ רע -->
<div (click)="submit()">שלח</div>
```

### **2. ARIA Labels (חובה לאלמנטים אינטראקטיביים)**
```html
<!-- ✅ טוב -->
<button mat-icon-button 
        [attr.aria-label]="isExpanded() ? 'סגור תפריט' : 'פתח תפריט'"
        (click)="toggleMenu()">
  <mat-icon>{{isExpanded() ? 'close' : 'menu'}}</mat-icon>
</button>

<input matInput 
       [attr.aria-describedby]="hasError() ? 'error-message' : null"
       placeholder="שם משתמש">
<div id="error-message" *ngIf="hasError()">
  {{errorMessage()}}
</div>
```

---

## 🧪 Testing Rules

### **1. Test Structure (חובה)**
```typescript
// ✅ Arrange-Act-Assert pattern
describe('UserService', () => {
  let service: UserService;
  let httpMock: jasmine.SpyObj<HttpClient>;

  beforeEach(() => {
    // Arrange
    const spy = jasmine.createSpyObj('HttpClient', ['get']);
    TestBed.configureTestingModule({
      providers: [{ provide: HttpClient, useValue: spy }]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpClient) as jasmine.SpyObj<HttpClient>;
  });

  it('should fetch user by id', () => {
    // Arrange
    const userId = '123';
    const expectedUser: User = { id: userId, name: 'John' };
    httpMock.get.and.returnValue(of(expectedUser));

    // Act
    const result$ = service.getUser(userId);

    // Assert
    result$.subscribe(user => {
      expect(user).toEqual(expectedUser);
      expect(httpMock.get).toHaveBeenCalledWith(`/api/users/${userId}`);
    });
  });
});
```

### **2. Test Coverage (חובה)**
- **Components**: בדיקת כל method public
- **Services**: בדיקת כל method
- **Guards**: בדיקת כל scenario
- **Pipes**: בדיקת כל transformation

---

## 📁 File Structure Rules

### **1. Feature-Based Structure (חובה)**
```
src/app/
├── core/                 # Singletons only
├── shared/              # Reusable components
├── features/            # Feature modules
│   └── feature-name/
│       ├── components/
│       ├── services/
│       ├── models/
│       └── feature.routes.ts
└── layout/              # Layout components
```

### **2. File Naming (חובה)**
```
component-name.component.ts
component-name.component.html
component-name.component.scss
service-name.service.ts
guard-name.guard.ts
pipe-name.pipe.ts
model-name.interface.ts
```

---

## 🚫 אסור בהחלט

### **1. אסור להשתמש ב:**
```typescript
// ❌ אסור
any
document.getElementById()
window.location
setTimeout() // השתמש ב-RxJS timer
setInterval() // השתמש ב-RxJS interval
```

### **2. אסור לעשות:**
- מוטציה של arrays/objects
- DOM manipulation ישיר
- Global variables
- Inline styles/templates (מעל 3 שורות)
- Constructor injection (השתמש ב-inject())

---

## ✅ חובה לעשות

### **1. בכל קומפוננט:**
- `ChangeDetectionStrategy.OnPush`
- `standalone: true`
- קבצים נפרדים לHTML/SCSS
- TrackBy functions ב-loops

### **2. בכל שירות:**
- `@Injectable({ providedIn: 'root' })`
- Error handling מובנה
- Type safety מלא
- Return types מפורשים

### **3. בכל template:**
- Semantic HTML
- ARIA labels
- Angular Material components
- Control Flow החדש (@if, @for, @switch)

---

## 🎯 סיכום כללי יסוד

**כללים אלו הם הבסיס לכל פרויקט Angular ויש לעקוב אחריהם ללא יוצא מן הכלל.**

**הקובץ השני יכיל כללים ספציפיים לתכונות מתקדמות או דרישות פרויקט ספציפיות.**