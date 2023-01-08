import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveBoxComponent } from './live-box.component';

describe('LiveBoxComponent', () => {
  let component: LiveBoxComponent;
  let fixture: ComponentFixture<LiveBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LiveBoxComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiveBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
