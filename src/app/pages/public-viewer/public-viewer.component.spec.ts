import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicViewerComponent } from './public-viewer.component';

describe('PublicViewerComponent', () => {
  let component: PublicViewerComponent;
  let fixture: ComponentFixture<PublicViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublicViewerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PublicViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
