import { Component, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

interface SearchResponse {
  searchId: number;
  userId: number;
  comparedImage: string;
}

@Component({
  selector: 'app-checker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './checker.component.html',
  styleUrls: ['./checker.component.css']
})
@Injectable({
  providedIn: 'root'
})
export class CheckerComponent {
  fileName: string = '';
  imageSrc: string | ArrayBuffer | null = null;
  userId: number = 1;
  searchId: number = 1;
  comparedImage: string | undefined;
  isLoading: boolean = false;
  similarityResult: any = null;
  noMatchesFound: boolean = false;

  constructor(private http: HttpClient) {}

  
  loadTrademarkImage(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      this.fileName = file.name;

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.imageSrc = e.target?.result as string | ArrayBuffer | null;
        this.sendImageToApi(this.imageSrc as string);
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        this.imageSrc = null;
      };
      reader.readAsDataURL(file);
    } else {
      this.fileName = '';
      this.imageSrc = null;
    }
  }

  sendImageToApi(base64Image: string): void {
    const base64Data = base64Image.split(',')[1];
    const userId: string | null = localStorage.getItem('id');
    const payload = {
      userId: userId,
      comparedImage: base64Data,
      fileName: this.fileName
    };
  
    this.http.post<SearchResponse>('http://ec2-52-12-34-56.compute-1.amazonaws.com:8080/api/userTrademarks/add', payload)
    .subscribe(
      response => {
        console.log('Image uploaded successfully', response);
        this.searchId = response.searchId;
        this.comparedImage = 'data:image/png;base64,' + response.comparedImage;
        localStorage.getItem(this.comparedImage)
        localStorage.setItem('searchId', this.searchId.toString());
      },
      error => {
        console.error('Error uploading image', error);
      }
    );
  }

  checkSimilarity(): void {
    const searchId = localStorage.getItem('searchId');
    if (searchId) {
        this.isLoading = true;
        this.http.get<any[]>(`http://ec2-52-12-34-56.compute-1.amazonaws.com:8080/check-similarity/${searchId}`)
            .pipe(
                switchMap((response: any[]) => {
                    if (response.length === 0) {
                        console.log('No results found.');
                        this.similarityResult = null;
                        this.noMatchesFound = true;
                        this.isLoading = false;
                        return of([]);
                    }
                    const imageRequests = response.map(item => 
                        this.http.get(`http://ec2-52-12-34-56.compute-1.amazonaws.com:8080/trademarks/${item.trademarkId}/image`,
                            { responseType: 'blob' })
                            .pipe(
                                map(blob => ({
                                    ...item,
                                    imageBlob: blob,
                                    imageUrl: URL.createObjectURL(blob)
                                })),
                                catchError(() => of({
                                    ...item,
                                    imageBlob: null,
                                    imageUrl: null
                                }))
                            )
                    );
                    return forkJoin(imageRequests);
                })
            )
            .subscribe(
                (results: any[]) => {
                    if (results.length > 0) {
                        console.log('Similarity check response with images:', results);
                        this.similarityResult = results;
                    }
                    this.isLoading = false;
                },
                (error) => {
                    console.error('Error checking similarity:', error);
                    this.isLoading = false;
                }
            );
    } else {
        console.error('No searchId found in localStorage');
    }
}
}