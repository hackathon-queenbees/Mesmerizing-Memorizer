import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class UserdataService {

  constructor(private db: AngularFirestore) { }

  insertUserData(userDataObtained){
    this.db.collection('/userData').add(userDataObtained);
    alert("Reminder added successfully");
  }

  updateNotificationSent(id){
    //this.db.collection('/userData').doc(1).set(userDataObtained);
    this.db.doc(`userData/${id}`).update({notificationSent:'yes'});
  }

  getAllUserData(){
    this.db.collection("userData").snapshotChanges().subscribe((data) => {
      let a = data.map(e => {
        return {
          id: e.payload.doc.id, category: e.payload.doc.data()["category"],
          downloadURL: e.payload.doc.data()["downloadURL"], fileType: e.payload.doc.data()["fileType"],
          schedule: e.payload.doc.data()["schedule"], notificationSent: e.payload.doc.data()["notificationSent"]
        }
      })
      return a;
    })
  }
}
