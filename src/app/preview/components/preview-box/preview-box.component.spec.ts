import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviewBoxComponent } from './preview-box.component';

describe('PreviewBoxComponent', () => {
  let component: PreviewBoxComponent;
  let fixture: ComponentFixture<PreviewBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PreviewBoxComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PreviewBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
