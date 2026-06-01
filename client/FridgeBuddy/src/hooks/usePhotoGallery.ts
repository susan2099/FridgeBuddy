// https://ionicframework.com/docs/react/your-first-app/taking-photos

import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

const FILE_EXTENSION = ".png";

export function usePhotoGallery() {
    const [photos, setPhotos] = useState<UserPhoto[]>([]);
	const clearPhotos = () => setPhotos([]);

	const addNewToGallery = async () => {
		// Take a photo
		const capturedPhoto = await Camera.getPhoto({
			resultType: CameraResultType.DataUrl,
			source: CameraSource.Camera,
			// source: CameraSource.Prompt,
			quality: 100,
		});


        const fileName = Date.now() + FILE_EXTENSION;
        const savedImageFile = [
            {
                filepath: fileName,
                webviewPath: capturedPhoto.dataUrl,
            },
            // ...photos, // dont want to retain old images
        ];

		// console.log("THE SAVED IMAGE FILE\n", savedImageFile[0]);
        setPhotos(savedImageFile);
		return savedImageFile[0];
	};

	return {
		addNewToGallery,
		clearPhotos,
		photos
	};
}

export interface UserPhoto {
	filepath: string;
	webviewPath?: string;
}