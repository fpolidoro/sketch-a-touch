import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HtmlSnippetComponent } from './html-snippet.component';

describe('HtmlSnippetComponent', () => {
  let component: HtmlSnippetComponent;
  let fixture: ComponentFixture<HtmlSnippetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HtmlSnippetComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HtmlSnippetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
