import { NgModule } from "@angular/core";
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';

const modules = [
    MatSelectModule,
    MatInputModule,
    MatFormFieldModule,
    MatTableModule,
    MatSortModule
];

@NgModule({
  imports: modules,
  exports: modules
})
export class MaterialModule {}