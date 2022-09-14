import { Component, ElementRef, OnInit, SimpleChanges, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import * as RecordRTC from 'recordrtc';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { AngularFireDatabase, AngularFireObject } from '@angular/fire/database';
import { AngularFireStorage } from '@angular/fire/storage';
import { AngularFirestore } from '@angular/fire/firestore';
import { MusicService } from '../music.service';
import * as  moment from 'moment';
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  imageUrl;
  imageFiles = {
    'wakeup': ['happy-cute-little-kid-girl-wake-up-169737451.jpg'],
    'breakfast': ['happy-cute-little-kid-girl-wake-up-169737451.jpg']
  };
  urlObtained;
  private audioObj: HTMLAudioElement;
  private videoObj: HTMLVideoElement;
  @ViewChild('audio') audio: ElementRef;
  @ViewChild('audioPlay') audioPlay: ElementRef;
  @ViewChild('videoEl') videoEl: ElementRef;
  constructor(private domSanitizer: DomSanitizer, private db: AngularFirestore,
    private ref: ChangeDetectorRef, private uploadService: MusicService) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.videoObj = this.videoEl.nativeElement;
    this.getAllUserData();
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
          schedule: e.payload.doc.data()["schedule"], notificationSent: e.payload.doc.data()["notificationSent"],
          imgFile: e.payload.doc.data()["imgFile"] , customCategory : e.payload.doc.data()["customCategory"]
        }
      })
      // this.dataSource.data = a;
      console.log(a);
      let _this = this;
      let timerId = setTimeout(function tick() {
        var d = new Date();
        console.log("inside settimeout");
        if (d.getHours() == 0 && d.getMinutes() == 2) {
          for (let i = 0; i < a.length; i++) {
            if (a[i].notificationSent == "yes")
              _this.db.doc(`userData/${a[i].id}`).update({ notificationSent: "no" });
          }//end of day updating all reminders sent to no, to keep sending reminders next day
        }
        for (let i = 0; i < a.length; i++) {
          var time = moment(a[i].schedule, ["h:mm A"]).format("HH:mm");
          this.hrsAndMin = time.split(":");
          var eta_ms = new Date(d.getFullYear(), d.getMonth(), d.getDate(), this.hrsAndMin[0], this.hrsAndMin[1]).getTime() - Date.now();
          if (eta_ms <= 0 && a[i].notificationSent == "no") {
            let id = a[i].id;
            //console.log("available reminders::" + JSON.stringify(a[i]));
            _this.urlObtained = a[i].downloadURL;
            if (a[i].fileType == "Record Audio" || a[i].fileType == "Upload Audio") {
              _this.setImageForReminder(a[i].fileType,a[i]);
            }
            // let el: HTMLElement = _this.myButton.nativeElement as HTMLElement;
            // el.click();
            let upcoming  = a.filter(item => {
              if(item.notificationSent == "no"){
              let time = moment(item.schedule, ["h:mm A"]).format("HH:mm");
              let hrs = time.split(":");
              return parseInt(hrs[0])  < d.getHours() + 3
             } });
            console.log("upcoming",upcoming);

            _this.playAudioOrVideo(a[i]);
            //_this.updateNotification(id); // updating notification sent in firebase database
          }
        }
        timerId = setTimeout(tick, 2000); // calling settimeout repeatedly to check if reminders need to be sent
      }, 2000);

    })
    //}
  }

  setImageForReminder(category,userData) {
    let x = this.uploadService.getDownloadUrl('/images/' + this.imageFiles[category]);
    x.subscribe(
      (url) => {
        this.imageUrl = url;
      }
    )
    if(userData.customCategory == "yes"){
      this.imageUrl = userData.imgFile;
    }
    
  }

  updateNotification(id) {
    this.db.doc(`userData/${id}`).update({ notificationSent: "yes" });
  }

  playAudioOrVideo(userData) {
    if (userData.fileType == "Record Audio" || userData.fileType == "Upload Audio") {
      this.playAudioFile();
    }
    else if (userData.fileType == "Record Video" || userData.fileType == "Upload Video") {
      this.playVideoFile();
    }

  }

  playAudioFile() {
    this.audioObj = this.audioPlay.nativeElement;
    this.audioObj.src = this.urlObtained;
    var prom = this.audioObj.play();
    //this.filePlaying = "audio";
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

  playVideoFile() {
    this.videoObj = this.videoEl.nativeElement;
    this.videoObj.src = this.urlObtained;
    var prom = this.videoObj.play();
    //this.filePlaying = "video";
    if (prom) {
      prom.catch((e) => {
        console.log(e)
        if (e.name === 'NotAllowedError' || e.name === 'NotSupportedError') {
          console.log(e.name);
        }
      }).then(() => {
        console.log("playing video !!!");
        this.videoObj.play();
      });
    }

  }

}
