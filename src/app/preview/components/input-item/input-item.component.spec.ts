import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InputItemComponent } from './input-item.component';

describe('InputItemComponent', () => {
  let component: InputItemComponent;
  let fixture: ComponentFixture<InputItemComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InputItemComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InputItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
