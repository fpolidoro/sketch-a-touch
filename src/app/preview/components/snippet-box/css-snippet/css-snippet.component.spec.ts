import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CssSnippetComponent } from './css-snippet.component';

describe('CssSnippetComponent', () => {
  let component: CssSnippetComponent;
  let fixture: ComponentFixture<CssSnippetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CssSnippetComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CssSnippetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
