import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavbarcomponentComponent } from './navbarcomponent.component';

describe('NavbarcomponentComponent', () => {
  let component: NavbarcomponentComponent;
  let fixture: ComponentFixture<NavbarcomponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NavbarcomponentComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NavbarcomponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
