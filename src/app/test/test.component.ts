import { Component, ElementRef, OnInit, SimpleChanges, ViewChild,ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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


@Component({
  selector: 'test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss'],
  changeDetection: ChangeDetectionStrategy.Default
})
export class TestComponent implements OnInit {
  //Lets declare Record OBJ
  record;
  //Will use this flag for toggeling recording
  recording = false;
  //URL of Blob
  url;
  error;
  selectedFiles?: File;
  currentFileUpload?: FileUpload;
  fromRecordingToSaveInFirebase = false;
  fileName;
  percentage = 0;
  @ViewChild('uploadFile', {}) uploadFile: ElementRef;
  selectFilesButtonType: 'button' | 'menu' | 'reset' | 'submit' = 'button';
  percentageDisplay;
  disableUploadButton: boolean;
  userData: AngularFireObject<any>;
  @ViewChild('audio') audio: ElementRef;
  private audioObj: HTMLAudioElement;
  userForm: FormGroup;
  categoryList = ["wakeup", "breakfast", "school"];
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
  imageFiles = {
    'wakeup': ['happy-cute-little-kid-girl-wake-up-169737451.jpg'],
    'breakfast': ['happy-cute-little-kid-girl-wake-up-169737451.jpg']
  };

  // Form
  model = {
    categoryChosen: new FormControl(''),
    fileTypeChosen: new FormControl(''),
    timeChosen: new FormControl('')
  };

  @ViewChild('videoElement') videoElement: ElementRef;
  video: any;
  isVideoRecording = false;
  enableAddReminder = false;
  videoRecordedTime;
  videoBlobUrl;
  videoBlob;
  videoName;
  videoStream: MediaStream;
  videoConf = { video: { facingMode: "user", width: 320 }, audio: true }

  constructor(private domSanitizer: DomSanitizer, private uploadService: MusicService,
    private fStorage: AngularFireStorage, private userDataService: UserdataService,
    private fb: FormBuilder, private db: AngularFirestore,
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
    this.action = '';
    this.imageUrl = "";
    this.enableAddReminder = false;
    //this.getAllUserData();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    
    this.getAllUserData();
    let el: HTMLElement = this.myButton.nativeElement as HTMLElement;
    el.click();

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
      console.log(a);
      let _this = this;
      let timerId = setTimeout(function tick() {
        var d = new Date();
        console.log("inside settimeout");
        for (let i = 0; i < a.length; i++) {
          var time = moment(a[i].schedule, ["h:mm A"]).format("HH:mm");
          this.hrsAndMin = time.split(":");
          var eta_ms = new Date(d.getFullYear(), d.getMonth(), d.getDate(), this.hrsAndMin[0], this.hrsAndMin[1]).getTime() - Date.now();
          if (eta_ms <= 0 && a[i].notificationSent == "no") {
            let id = a[i].id;
            _this.urlObtained = a[i].downloadURL;
            _this.setImageForReminder(a[i].category);
            // let el: HTMLElement = _this.myButton.nativeElement as HTMLElement;
            // el.click();
            _this.playAudioOrVideo(a[i]);
            //_this.updateNotification(id); // updating notification sent in firebase database
          }
        }
        //timerId = setTimeout(tick, 2000); // calling settimeout repeatedly to check if reminders need to be sent
      }, 2000);

    })
    //}
  }

  playAudioOrVideo(userData){
    if(userData.fileType == "Record Audio" || userData.fileType == "Upload Audio"){
      this.playAudioFile();
    }
    else if(userData.fileType == "Record Video" || userData.fileType == "Record Video"){
      this.downloadVideoRecordedData();
    }
    
  }

  setImageForReminder(category){
    const x = this.uploadService.getDownloadUrl('/images/'+this.imageFiles[category]);
    x.subscribe(
      (url) => {
        this.imageUrl = url;
      }
    )
  }


  updateNotification(id) {
    this.db.doc(`userData/${id}`).update({ notificationSent: 'yes' });
  }

  playAudioFile() {
    this.audioObj = this.audio.nativeElement;
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

  upload(){
    if(this.fileTypeChosen == "Record Audio" || this.fileTypeChosen == "Upload Audio"){
      this.uploadAudio();
    }
    else if(this.fileTypeChosen == "Record Video" || this.fileTypeChosen == "Record Video"){
      this.downloadVideoRecordedData();
    }
  }
  
  uploadAudio() {
    if (this.selectedFiles) {
      let file: File = this.selectedFiles;
      this.fileName = "";

      if (this.fromRecordingToSaveInFirebase) {
        this.fileName = "audioRecording_" + Math.random();
      }
      else {
        file = this.selectedFiles[0];
      }

      let userDataObtained = {
        category: this.categoryChosen,
        fileType: this.fileTypeChosen,
        schedule: this.userForm.value.timeChosen,
        notificationSent: "no"
      }

      let currentUserData;
      if (file) {
        this.currentFileUpload = new FileUpload(file);
        this.uploadService.pushFileToStorage(this.currentFileUpload, this.fileName, userDataObtained,currentUserData).subscribe(
          percentage => {
            this.percentage = Math.round(percentage ? percentage : 0);
            this.percentageDisplay = this.percentage + "%";
            if (this.percentage == 100 && this.selectedFiles != undefined) {
              this.selectedFiles = undefined;
              file = undefined;
              this.percentageDisplay = ""
              this.disableUploadButton = true;
              alert("Upload complete");
            }
          },
          error => {
            console.log(error);
            this.selectedFiles = undefined;
            file = undefined;
            this.percentageDisplay = ""
            this.disableUploadButton = true;
          }
        );
      }
    }
  }

  onCategoryChange(event) {
    this.categoryChosen = this.userForm.value.categoryChosen;
  }

  onFileTypeChange(event) {
    this.fileTypeChosen = this.userForm.value.fileTypeChosen;
    if (this.fileTypeChosen == "Record Audio") {
      this.action = 'record';
    }
    if (this.fileTypeChosen == "Upload Audio") {
      this.action = "upload";
    }
    if (this.fileTypeChosen == 'Upload Video') {
      this.action = "upload";
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
    const file: File | null = this.videoBlob;
      this.fileName = "videoRecording_" + Math.random();
      let userDataObtained = {
        category: this.categoryChosen,
        fileType: this.fileTypeChosen,
        schedule: this.userForm.value.timeChosen,
        notificationSent: "no"
      }
      let currentUserData;
    if (file) {
      this.currentFileUpload = new FileUpload(file);
      this.uploadService.pushFileToStorage(this.currentFileUpload,this.fileName,userDataObtained,currentUserData).subscribe(
        percentage => {
          this.percentage = Math.round(percentage ? percentage : 0);
        },
        error => {
          console.log(error);
        }
      );
    }
    //this._downloadFile(this.videoBlob, 'video/mp4', this.videoName);
  }
  _downloadFile(data: any, type: string, filename: string): any {
    const blob = new Blob([data], { type: type });
    const url = window.URL.createObjectURL(blob);
    //this.video.srcObject = stream;
    //const url = data;
    const anchor = document.createElement('a');
    anchor.download = filename;
    anchor.href = url;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }


}


