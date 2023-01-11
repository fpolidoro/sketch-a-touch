import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DrawBoxComponent } from './draw-box.component';

describe('DrawBoxComponent', () => {
  let component: DrawBoxComponent;
  let fixture: ComponentFixture<DrawBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DrawBoxComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DrawBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
