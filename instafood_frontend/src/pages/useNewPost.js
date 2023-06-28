import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { db, auth, storage, functions } from '../firebaseConf';
import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, updateDoc, serverTimestamp, getDoc, arrayUnion } from 'firebase/firestore';

import { generateUniqueID } from 'web-vitals/dist/modules/lib/generateUniqueID';

import listenerImplementer from '../listeners/ListenerImplementer';

function useNewPost() {

    const navigate = useNavigate();
    const user = auth.currentUser;
    const addPostToFollowersToView = httpsCallable(functions, 'addPostToFollowersToView');

    // State for post details
    const [title, setTitle] = useState('');
    const [caption, setCaption] = useState('');

    const [imageObjects, setImageObjects] = useState([]);
    const allowedImageTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [shouldShowArrows, setShouldShowArrows] = useState(false);

    const [selectedCategories, setSelectedCategories] = useState([]);

    // State for listeners
    const [userDocListener, setUserDocListener] = useState(null);

    // State for post submission
    const [userID, setUserID] = useState('');

    async function setupListeners() {
        const userDocListener = await listenerImplementer.getUserDocListener();
        setUserDocListener(userDocListener);
    }

    useEffect(() => {
        setupListeners();
    }, []);

    useEffect(() => {
        if (userDocListener) {
            const userDoc = userDocListener.getCurrentDocument();
            setUserID(userDoc.userID);
        }
    }, [userDocListener]);

    function handleImageChange(e) {
        const newImageObjects = [...imageObjects];

        for (const image of e.target.files) {

            if (allowedImageTypes.includes(image.type)) {

                let isExistingImage = false;

                for (const imageObject of imageObjects) {
                    if (_isSameImage(imageObject.content, image)) {
                        isExistingImage = true;
                        break;
                    }
                }

                if (!isExistingImage) {

                    const newImageObject = {
                        content: image,
                        uniqueID: generateUniqueID(),
                        imageURL: URL.createObjectURL(image),
                    };
                    newImageObjects.push(newImageObject);

                } else {
                    // Handle existing image
                    console.log('Existing image');
                }

            } else {
                // Handle invalid file type
                console.log('Invalid file type');
            }
        }

        setImageObjects(newImageObjects);
        console.log(newImageObjects);
        e.target.value = null;
    }

    function _isSameImage(image1, image2) {

        if (image1.size !== image2.size) {
            return false;
        }

        if (image1.name !== image2.name) {
            return false;
        }

        if (image1.type !== image2.type) {
            return false;
        }

        return true;
    }


    function handleImageDelete(uniqueID) {
        const newImageObjects = imageObjects.filter(
            imageObject => imageObject.uniqueID !== uniqueID
        );

        setImageObjects(newImageObjects);
        console.log(newImageObjects);

    }

    const handleSubmitNewPost = async (e) => {
        e.preventDefault();

        const timestamp = serverTimestamp();
        const uniqueID = generateUniqueID();

        const postID = `${userID}_${uniqueID}`;

        const postDocRef = doc(db, 'posts', postID);

        const uploadTasks = imageObjects.map(async (imageObject) => {
            const imageRef = ref(storage, `/${userID}/${postID}/${imageObject.content.name}/${imageObject.uniqueID}`);
            const snapshot = await uploadBytesResumable(imageRef, imageObject.content);
            return getDownloadURL(snapshot.ref);
        });

        const imageUrls = await Promise.all(uploadTasks);

        const postDoc = {
            title: title,
            creator: userID,
            caption: caption,
            date_created: timestamp,
            images: imageUrls,
            postID: postID,
            likes: [],
            comments: [],
            categories: selectedCategories,
        };

        await setDoc(postDocRef, postDoc);

        await updateDoc(
            doc(db, 'users', user.uid),
            {
                personalPosts: arrayUnion(postID)
            }
        );

        addPostToFollowersToView({
            postID: postID,
            creatorUID: user.uid
        });

        for (const category of selectedCategories) {
            const categoryToString = category.toString();
            const categoryRef = doc(db, 'categorisedPosts', categoryToString);
            const categoryDoc = await getDoc(categoryRef);

            if (categoryDoc.exists()) {
                await updateDoc(categoryRef, {
                    post_id_array: arrayUnion(postID)
                });
            } else {
                await setDoc(categoryRef, {
                    post_id_array: [postID]
                });
            }
        }

        navigate('/dashboard');
    };

    return {
        title,
        setTitle,
        caption,
        setCaption,
        imageObjects,
        setImageObjects,
        selectedCategories,
        setSelectedCategories,
        handleImageChange,
        handleSubmitNewPost,
        handleImageDelete,

        currentImageIndex,
        setCurrentImageIndex,
        shouldShowArrows,
        setShouldShowArrows,
    }
}

export default useNewPost;
