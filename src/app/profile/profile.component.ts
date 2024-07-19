import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../user/user.service';
import { User } from '../user/user';
import { UserUpdate } from '../user/UserUpdate';
import { HttpClient } from '@angular/common/http';
import { mergeMap, map } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

interface SearchHistoryItem {
  searchId: number;
  userId: number;
  comparedImage: string;
  createdAt: string;
  fileName: string;
  similarTrademarksPhotos: SimilarTrademarkPhoto[];
}
interface SimilarTrademark {
  trademarkId: number;
  imageUrl: string;
  similarityScore: number;
}
interface SimilarTrademarkPhoto {
  id: number;
  searchId: number;
  trademarkId: number;
  image: string;
}
@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  providers: [UserService]
})
export class ProfileComponent implements OnInit {
  isEditing: boolean = false;
  email: string = '';
  username: string = '';
  password: string = '';
  id: string = '';

  tempEmail: string = '';
  tempUsername: string = '';
  tempPassword: string = '';

  searchHistory: SearchHistoryItem[] = [];

  constructor(private router: Router, private userService: UserService, private http: HttpClient) {}

  ngOnInit() {
    this.getUserParameters();
    this.getSearchHistory();
  }

  getUserParameters() {
    const userId: string | null = localStorage.getItem('id');
    if (userId) {
      this.userService.getUserById(userId).subscribe((data: User) => {
        this.username = data.username;
        this.email = data.email;
      });
    }
  }

  editProfile() {
    this.isEditing = true;
    this.tempEmail = this.email;
    this.tempUsername = this.username;
    this.tempPassword = '';
  }

  cancelEdit() {
    this.isEditing = false;
  }

  submitChanges() {
    const userId = localStorage.getItem('id');
    if (userId) {
      const updatedUser: UserUpdate = {
        username: this.tempUsername,
        password: this.tempPassword
      };

      this.userService.updateUser(userId, updatedUser).subscribe(
        (response: User) => {
          this.email = response.email;
          this.username = response.username;
          this.password = '';
          localStorage.setItem('email', this.email);
          localStorage.setItem('username', this.username);
          this.isEditing = false;
          console.log('User updated succesfully');
        },
        (error) => {
          console.error('Error during user update', error);
        }
      );
    } else {
      console.error('Brak ID użytkownika');
    }
  }

  getSearchHistory() {
    const userId: string | null = localStorage.getItem('id');
    if (userId) {
      this.http.get<SearchHistoryItem[]>(`http://ec2-52-12-34-56.compute-1.amazonaws.com:8080/api/userTrademarks/${userId}`)
        .pipe(
          mergeMap(searchHistory => {
            const photoRequests = searchHistory.map(item => 
              this.http.get<SimilarTrademarkPhoto[]>(`http://ec2-52-12-34-56.compute-1.amazonaws.com:8080/get-similar/${item.searchId}`)
            );
            return forkJoin(photoRequests).pipe(
              map(photos => searchHistory.map((item, index) => ({
                ...item,
                similarTrademarksPhotos: photos[index]
              })))
            );
          })
        )
        .subscribe(
          (data) => {
            this.searchHistory = data.sort((a, b) => {
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            console.log('Search history fetched successfully', data);
          },
          (error) => {
            console.error('Error fetching search history', error);
          }
        );
    }
  }
}