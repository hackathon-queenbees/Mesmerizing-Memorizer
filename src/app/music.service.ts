import { Injectable } from "@angular/core";
import {
  AngularFireStorage,
  AngularFireStorageReference
} from "@angular/fire/storage";
import {
  AngularFireDatabase, AngularFireList, AngularFireObject
} from "@angular/fire/database";
import { Observable } from "rxjs";
import { finalize } from 'rxjs/operators';
import { UserData } from './models/user-data';
import { UserdataService } from './userdata.service';

@Injectable({
  providedIn: 'root'
})
export class MusicService {

  ref: AngularFireStorageReference;
  downloadURL: Observable<string>;
  audiofiles = {
    'angry': ['sample-12s.mp3']
  };
  
  fielUpload = {
    key: String,
  name: String,
  url: String,
  file: File}

  constructor(
    private fStorage: AngularFireStorage,
    private db: AngularFireDatabase,private storage: AngularFireStorage,private userDataService :UserdataService
  ) { }


  getDownloadUrl(fileName: any) {
    const audofile = this.fStorage.ref(fileName);
    this.downloadURL = audofile.getDownloadURL();
    return this.downloadURL;
  }
  task: AngularFireObject<any>;
  private basePath = '/uploads';
  pushFileToStorage(fileUpload,fileName,userDataObtained,currentUserData): Observable<number> {
    let filePath = `${this.basePath}/${fileUpload.file.name}`;
    if(fileName!=""){
      filePath = `${this.basePath}/${fileName}`;
    }
    const storageRef = this.storage.ref(filePath);
    const uploadTask = this.storage.upload(filePath, fileUpload.file);
    uploadTask.snapshotChanges().pipe(
      finalize(() => {
        storageRef.getDownloadURL().subscribe(downloadURL => {
          console.log(downloadURL);
          fileUpload.url = downloadURL;
          fileUpload.name = fileUpload.file.name;
          userDataObtained.downloadURL = downloadURL;
          for(let i=0;i<currentUserData.length;i++){ //updating the record if newly added reminder collides with existing
            if(currentUserData[i].category == userDataObtained.categoryChosen){

            }
          }
          //update usergiven schedule,file,category into realtime database
          this.userDataService.insertUserData(userDataObtained);

          if (fileName != "") {
            fileUpload.name = fileName;
          }
          this.saveFileData(fileUpload);
        });
      })
    ).subscribe();
    return uploadTask.percentageChanges();
  }

  private saveFileData(fileUpload): void {
    this.db.list(this.basePath).push(fileUpload);
  }

}
