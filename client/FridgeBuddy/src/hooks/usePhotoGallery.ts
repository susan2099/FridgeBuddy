// https://ionicframework.com/docs/react/your-first-app/taking-photos

import { useState } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

const FILE_EXTENSION = ".png";

export function usePhotoGallery() {
    const [photos, setPhotos] = useState<UserPhoto[]>([]);

	const addNewToGallery = async () => {
		// Take a photo
		const capturedPhoto = await Camera.getPhoto({
			resultType: CameraResultType.Uri,
			source: CameraSource.Camera,
			quality: 100,
		});

        const fileName = Date.now() + FILE_EXTENSION;
        const savedImageFile = [
            {
                filepath: fileName,
                webviewPath: capturedPhoto.webPath,
            },
            // ...photos, // dont want to retain old images
        ];

        setPhotos(savedImageFile);
	};

	return {
		addNewToGallery,
		photos
	};

}

export interface UserPhoto {
	filepath: string;
	webviewPath?: string;
}

export function toggleImage() {
	const imageContainer = document.getElementById("photoUploader") as HTMLDivElement;
	imageContainer.style.display = (imageContainer.style.display == "none") ? "flex" : "none";
}