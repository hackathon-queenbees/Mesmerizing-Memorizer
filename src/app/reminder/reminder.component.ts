import { Component, OnInit ,SimpleChanges,ViewChild,ElementRef,ChangeDetectionStrategy, ChangeDetectorRef} from '@angular/core';
import * as RecordRTC from 'recordrtc';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { FileUpload } from '../models/file-upload';
import { MusicService } from '../music.service';
import { AngularFireDatabase, AngularFireObject } from '@angular/fire/database';
import { AngularFireStorage } from '@angular/fire/storage';
import { UserData } from '../models/user-data';
import firebase from 'firebase';
import { AngularFirestore } from '@angular/fire/firestore';
import { UserdataService } from '../userdata.service';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import moment from 'moment/moment';
import { MatTableDataSource } from '@angular/material/table';
import { MatSort } from '@angular/material/sort';
import { VideoRecordingService } from '../video-recording.service';
import { NgxSpinnerService } from "ngx-spinner";  

@Component({
  selector: 'app-reminder',
  templateUrl: './reminder.component.html',
  styleUrls: ['./reminder.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class ReminderComponent implements OnInit {

 //Lets declare Record OBJ
 record;
 //Will use this flag for toggeling recording
 recording = false;
 //URL of Blob
 url;
 error;
 selectedFiles?: File;
 selectedImageFiles?: File;
 currentFileUpload?: FileUpload;
 fromRecordingToSaveInFirebase = false;
 fileName;
 percentage = 0;
 @ViewChild('uploadFile', {}) uploadFile: ElementRef;
 @ViewChild('uploadImageFile', {}) uploadImageFile: ElementRef;
 selectFilesButtonType: 'button' | 'menu' | 'reset' | 'submit' = 'button';
 percentageDisplay;
 disableUploadButton: boolean;
 userData: AngularFireObject<any>;
 @ViewChild('audio') audio: ElementRef;
  @ViewChild('audioPlay') audioPlay: ElementRef;
 private audioObj: HTMLAudioElement;
  private videoObj :HTMLVideoElement;
 userForm: FormGroup;
 categoryList =  ["MorningRoutine Chart","Wakeup", "Shower", "Get Dressed","Breakfast","School","Lunch","Snack Time","Playtime","Fitness","Dinner","Nap Time","Custom"];
 fileTypeList = ["Record Audio","Record Video", "Upload Audio", "Upload Video"]
 categoryChosen;
 fileTypeChosen;
 timeChosen;
 action;
 hrsAndMin = [];
 @ViewChild('myButton') myButton : ElementRef;
 urlObtained;
 public displayedColumns = ['Category', 'file', 'Scheduled time', 'delete'];
 public dataSource = new MatTableDataSource<UserData>();
 @ViewChild(MatSort) sort: MatSort;
 imageUrl;

 // Form
 model = {
   categoryChosen: new FormControl(''),
   fileTypeChosen: new FormControl(''),
   timeChosen: new FormControl(''),
   customCategory : new FormControl('')
 };

 @ViewChild('videoElement') videoElement: ElementRef;
  @ViewChild('videoEl') videoEl: ElementRef;
 video: any;
 isVideoRecording = false;
 enableAddReminder = false;
 videoRecordedTime;
 videoBlobUrl;
 videoBlob;
 videoName;
 videoStream: MediaStream;
 videoConf = { video: { facingMode: "user", width: 320 }, audio: true }
  currentUserData: any;
  choosefileText;
  showCustomUpload: boolean;
  fileNameForImage: any;

 constructor(private domSanitizer: DomSanitizer, private uploadService: MusicService,
   private fStorage: AngularFireStorage, private userDataService: UserdataService,
   private fb: FormBuilder, private db: AngularFirestore,private SpinnerService: NgxSpinnerService,
   private ref: ChangeDetectorRef, private videoRecordingService: VideoRecordingService) {
   this.userForm = this.fb.group(this.model, {});

   this.videoRecordingService.recordingFailed().subscribe(() => {
     this.isVideoRecording = false;
     this.ref.detectChanges();
   });

   this.videoRecordingService.getRecordedTime().subscribe((time) => {
     this.videoRecordedTime = time;
     this.ref.detectChanges();
   });

   this.videoRecordingService.getStream().subscribe((stream) => {
     this.videoStream = stream;
     this.ref.detectChanges();
   });

   this.videoRecordingService.getRecordedBlob().subscribe((data) => {
     this.videoBlob = data.blob;
     this.videoName = data.title;
     this.videoBlobUrl = this.domSanitizer.bypassSecurityTrustUrl(data.url);
     this.ref.detectChanges();
   });
 }

 ngOnInit(): void {
   this.disableUploadButton = true;
   this.action = 'start';
   this.imageUrl = "";
   this.fileTypeChosen = "";
   this.enableAddReminder = false;
   this.getAllUserData();
 }

 ngAfterViewInit(): void {
   this.dataSource.sort = this.sort;
   
   //this.getAllUserData();
  //  let el: HTMLElement = this.myButton.nativeElement as HTMLElement;
  //  el.click();

   this.video = this.videoElement.nativeElement;
   
 }

 ngOnChanges(change: SimpleChanges) {
   //this.playAudioFile();
 }

 getAllUserData() {
   // return new Promise<any>((resolve)=> {
   //this.db.collection('userData', ref => ref.where('name', '==', 'mss')).valueChanges().subscribe(users => resolve(users))
   //this.db.collection('userData').valueChanges({ idField: 'id' }).subscribe(users => resolve(users));
   let a;
   this.db.collection("userData").snapshotChanges().subscribe((data) => {
     a = data.map(e => {
       return {
         id: e.payload.doc.id, category: e.payload.doc.data()["category"],
         downloadURL: e.payload.doc.data()["downloadURL"], fileType: e.payload.doc.data()["fileType"],
         schedule: e.payload.doc.data()["schedule"], notificationSent: e.payload.doc.data()["notificationSent"]
       }
     })
     this.dataSource.data = a;
     this.currentUserData = a;
     console.log(a);
   })
   //}
 }


 updateNotification(id) {
   this.db.doc(`userData/${id}`).update({ notificationSent: 'yes' });
 }

 playAudioFile() {
    this.audioObj = this.audioPlay.nativeElement;
   this.audioObj.src = this.urlObtained;
   var prom = this.audioObj.play();
   if (prom) {
     prom.catch((e) => {
       console.log(e)
       if (e.name === 'NotAllowedError' || e.name === 'NotSupportedError') {
         console.log(e.name);
       }
     }).then(() => {
       console.log("playing sound !!!");
       this.audioObj.play();
     });
   }

 }

 sanitize(url: string) {
   return this.domSanitizer.bypassSecurityTrustUrl(url);
 }

 initiateRecording() {
   this.recording = true;
   let mediaConstraints = {
     video: false,
     audio: true
   };
   navigator.mediaDevices.getUserMedia(mediaConstraints).then(this.successCallback.bind(this), this.errorCallback.bind(this));

 }

 successCallback(stream) {
   var options = {
     mimeType: "audio/wav",
     numberOfAudioChannels: 1,
     sampleRate: 44100,
   };
   //Start Actuall Recording
   var StereoAudioRecorder = RecordRTC.StereoAudioRecorder;
   this.record = new StereoAudioRecorder(stream, options);
   this.record.record();
 }
 /**
 * Stop recording.
 */
 stopRecording() {
   this.recording = false;
   this.record.stop(this.processRecording.bind(this));
 }

 /**
* processRecording Do what ever you want with blob
* @param  {any} blob Blog
*/
 processRecording(blob) {

   this.url = URL.createObjectURL(blob);
   console.log("blob", blob);
   console.log("url", this.url);
   this.selectFile(blob)
 }
 /**
 * Process Error.
 */
 errorCallback(error) {
   this.error = 'Can not play audio in your browser';
 }
 selectFile(event: any): void {
   this.selectedFiles = event;
   this.enableAddReminder = true;
   this.fromRecordingToSaveInFirebase = true;
   //this.upload(); would upload on add reminder button
 }

 selectFileFromUI(event: any): void {
   this.selectedFiles = event.target.files;
   this.fromRecordingToSaveInFirebase = false;
   this.fileName = this.selectedFiles[0].name;
   this.enableAddReminder = true;
   this.disableUploadButton = false;
 }

 selectImageFileForCustom(event: any): void{
  this.selectedImageFiles = event.target.files;
   this.fileNameForImage = this.selectedImageFiles[0].name;
   this.enableAddReminder = true;
   this.disableUploadButton = false;
 }

 upload(){
   if(this.fileTypeChosen == "Record Audio" || this.fileTypeChosen == "Upload Audio" || this.fileTypeChosen == "Upload Video"){
     this.uploadFileToFirebase();
   }
    else if(this.fileTypeChosen == "Record Video"){
     this.downloadVideoRecordedData();
   }
 }
 
 uploadFileToFirebase() {
   if (this.selectedFiles) {
     let file: File = this.selectedFiles;
     this.fileName = "";
     this.SpinnerService.show(); 

     if (this.fromRecordingToSaveInFirebase) {
       this.fileName = "audioRecording_" + Math.random();
     }
     else {
       file = this.selectedFiles[0];
     }

     let userDataObtained = {
       category: this.categoryChosen,
       customCategory : "no",
       fileType: this.fileTypeChosen,
       schedule: this.userForm.value.timeChosen,
       notificationSent: "no",
       imgFile : null
     }

     if(this.categoryChosen == 'Custom'){
      userDataObtained = {
        category: this.userForm.value.customCategory,
        customCategory : "yes",
        fileType: this.fileTypeChosen,
        schedule: this.userForm.value.timeChosen,
        notificationSent: "no",
        imgFile : this.selectedImageFiles[0]
      }
     }

     if (file) {
       this.currentFileUpload = new FileUpload(file);
       this.uploadService.pushFileToStorage(this.currentFileUpload, this.fileName, userDataObtained ,this.currentUserData).subscribe(
         percentage => {
           this.percentage = Math.round(percentage ? percentage : 0);
           this.percentageDisplay = this.percentage + "%";
           if (this.percentage == 100 && this.selectedFiles != undefined) {
             this.selectedFiles = undefined;
             file = undefined;
             this.percentageDisplay = ""
             this.disableUploadButton = true;
             //alert("Upload complete");
             this.fileTypeChosen = "";
             this.action = "";
             this.url = undefined;
             this.fileNameForImage = ''
             this.fileName = ''
             this.userForm.reset();
             setTimeout(() => {
             this.SpinnerService.hide(); 
            }, 200);
           }
         },
         error => {
           console.log(error);
           this.selectedFiles = undefined;
           file = undefined;
           this.percentageDisplay = ""
           this.disableUploadButton = true;
           this.fileNameForImage = ''
             this.fileName = ''
         }
       );
     }
   }
 }

 onCategoryChange(event) {
   this.categoryChosen = this.userForm.value.categoryChosen;
   this.showCustomUpload = false;
   if(this.categoryChosen == "Custom"){
    this.showCustomUpload = true;
   }
 }

 onFileTypeChange(event) {
   this.showCustomUpload = false;
   this.fileTypeChosen = this.userForm.value.fileTypeChosen;
   if (this.fileTypeChosen == "Record Audio") {
    this.isVideoRecording = false;
    this.videoBlobUrl =  undefined;
     this.action = 'record';
     if(this.categoryChosen == 'Custom')
     this.showCustomUpload = true;
   }
   else if (this.fileTypeChosen == "Upload Audio") {
    this.isVideoRecording = false;
    this.videoBlobUrl =  undefined;
     this.action = "upload";
     this.choosefileText = "Choose Audio File";
     if(this.categoryChosen == 'Custom')
     this.showCustomUpload = true;
   }
   else if (this.fileTypeChosen == 'Upload Video') {
    this.isVideoRecording = false;
    this.videoBlobUrl =  undefined;
    this.choosefileText = "Choose Video File";
     this.action = "upload";
   }
   else if (this.fileTypeChosen == 'Record Video') {
    this.action = "record";
  }
 }

 public redirectToDelete = (id: string) => {
   debugger;
   this.db.collection('/userData').doc(id).delete();
 }

 public doFilter = (value: string) => {
   this.dataSource.filter = value.trim().toLocaleLowerCase();
 }

 /* code for video*/
 startVideoRecording() {
   if (!this.isVideoRecording) {
     this.video.controls = false;
     this.isVideoRecording = true;
     this.videoRecordingService.startRecording(this.videoConf)
       .then(stream => {
         // this.video.src = window.URL.createObjectURL(stream);
         this.video.srcObject = stream;
         this.video.play();
       })
       .catch(function (err) {
         console.log(err.name + ": " + err.message);
       });
   }
 }

 abortVideoRecording() {
   if (this.isVideoRecording) {
     this.isVideoRecording = false;
     this.videoRecordingService.abortRecording();
     this.video.controls = false;
   }
 }

 stopVideoRecording() {
   if (this.isVideoRecording) {
     this.videoRecordingService.stopRecording();
     this.video.srcObject = this.videoBlobUrl;
     this.isVideoRecording = false;
     this.enableAddReminder = true;
     this.video.controls = true;
   }
 }

 clearVideoRecordedData() {
   this.videoBlobUrl = null;
   this.video.srcObject = null;
   this.video.controls = false;
   this.ref.detectChanges();
 }

 downloadVideoRecordedData() {
   //const blob = new Blob([this.videoBlob], { type: 'video/mp4' });
    let fName = "videoRecording_" + Math.random();
    this.SpinnerService.show(); 
    const file = new File(
      [this.videoBlob],
      fName,
      { type: 'video/mp4' }
    );
     this.fileName = "videoRecording_" + Math.random();
     let userDataObtained = {
       category: this.categoryChosen,
       fileType: this.fileTypeChosen,
       schedule: this.userForm.value.timeChosen,
       notificationSent: "no"
     }
   if (file) {
     this.currentFileUpload = new FileUpload(file);
     this.uploadService.pushFileToStorage(this.currentFileUpload,this.fileName,userDataObtained,this.currentUserData).subscribe(
       percentage => {
         this.percentage = Math.round(percentage ? percentage : 0);
         this.videoBlobUrl =  undefined;
         this.fileTypeChosen = "";
         this.action = "";
         this.userForm.reset();
         this.fileNameForImage = ''
             this.fileName = ''
         setTimeout(() => {
          this.SpinnerService.hide(); 
         }, 200);
       },
       error => {
         console.log(error);
       }
     );
   }
 }
}
