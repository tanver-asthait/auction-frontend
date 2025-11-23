import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamOwnerComponent } from './team-owner.component';

describe('TeamOwnerComponent', () => {
  let component: TeamOwnerComponent;
  let fixture: ComponentFixture<TeamOwnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamOwnerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeamOwnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
