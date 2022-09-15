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
import { AngularFirestore } from '@angular/fire/firestore';
import { FileUpload } from './models/file-upload';

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
    private db: AngularFireDatabase,private fstore:AngularFirestore,private storage: AngularFireStorage,private userDataService :UserdataService
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
    let uploadImageForCustomReminder;

    uploadTask.snapshotChanges().pipe(
      finalize(() => {
        storageRef.getDownloadURL().subscribe(downloadURL => {
          console.log(downloadURL);

          if(userDataObtained.customCategory == "yes" && (userDataObtained.fileType == "Record Audio"||userDataObtained.fileType == "Upload Audio")){
            let imageFileForUpload = new FileUpload(userDataObtained.imgFile);
            const storageRefForImage = this.storage.ref(`customImages/${userDataObtained.imgFile.name}`);
          uploadImageForCustomReminder = this.storage.upload(`customImages/${imageFileForUpload.file.name}`, imageFileForUpload.file);
          uploadImageForCustomReminder.snapshotChanges().pipe(
            finalize(() => {
              storageRefForImage.getDownloadURL().subscribe(downloadURLForImage => {

                console.log("image url",downloadURLForImage);
                
                imageFileForUpload.url = downloadURLForImage;
                imageFileForUpload.name = imageFileForUpload.file.name;
                userDataObtained.downloadURL = downloadURL;
                userDataObtained.imgFile = downloadURLForImage;
                for (let i = 0; i < currentUserData.length; i++) { //updating the record if newly added reminder collides with existing
                  if (currentUserData[i].category.toLowerCase() == userDataObtained.category.toLowerCase() && currentUserData[i].schedule == userDataObtained.schedule) {
                    this.fstore.collection('/userData').doc(currentUserData[i].id).delete();
                  }
                }
                //update user-given schedule,file,category into realtime database
                this.userDataService.insertUserData(userDataObtained);

                this.saveFileData(imageFileForUpload);
              })
            })
          ).subscribe();
          }
          else{
          fileUpload.url = downloadURL;
          fileUpload.name = fileUpload.file.name;
          userDataObtained.downloadURL = downloadURL;
          for(let i=0;i<currentUserData.length;i++){ //updating the record if newly added reminder collides with existing
            if(currentUserData[i].category.toLowerCase() == userDataObtained.category.toLowerCase() && currentUserData[i].schedule == userDataObtained.schedule){
              this.fstore.collection('/userData').doc(currentUserData[i].id).delete();
            }
          }
          //update usergiven schedule,file,category into realtime database
          this.userDataService.insertUserData(userDataObtained);

          if (fileName != "") {
            fileUpload.name = fileName;
          }
          this.saveFileData(fileUpload);
        }
        });
      })
    ).subscribe();
    return uploadTask.percentageChanges();
  }

  private saveFileData(fileUpload): void {
    this.db.list(this.basePath).push(fileUpload);
  }

}
