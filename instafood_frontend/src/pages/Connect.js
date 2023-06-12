import { useEffect, useState } from 'react';
import { db, auth } from '../firebaseConf';
import { doc, getDoc } from 'firebase/firestore';

import textSearch from '../functions/textSearch';
import DisplayArray from '../functions/DisplayArray';
import DisplayUserForConnect from '../functions/DisplayUserForConnect';

function Connect() {

    const user = auth.currentUser;

    const userIDsRef = doc(db, "lists", "userIDs");
    const [userIDs, setUserIDs] = useState([]);
    const [loadingUserIDs, setLoadingUserIDs] = useState(true);

    const userRef = doc(db, 'users', user.uid);
    const [followRequestsSent, setFollowRequestsSent] = useState([]);
    const [userOwnID, setUserOwnID] = useState('');
    const [following, setFollowing] = useState([]);
    const [loadingUser, setLoadingUser] = useState(true);

    const [input, setInput] = useState('');
    const [listOfPossibleMatches, setListOfPossibleMatches] = useState([]);

    useEffect(() => {
        async function getUser() {
            const userDoc = await getDoc(userRef);

            setFollowRequestsSent(userDoc.data().followRequestsSent);
            setUserOwnID(userDoc.data().userID);
            setFollowing(userDoc.data().following);
            setLoadingUser(false);
        }
        getUser();
    }, []);

    useEffect(() => {
        async function getUserIDs() {
            const snapshot = await getDoc(userIDsRef);
            const userIDs = snapshot.data().userIDs;
            setUserIDs(userIDs);
            setLoadingUserIDs(false);
        }
        getUserIDs();
    }, []);

    useEffect(() => {
        const possibleMatches = textSearch(input, userIDs);
        const filterOwnID = possibleMatches.filter(c => c !== userOwnID);
        setListOfPossibleMatches(filterOwnID);
    }, [input]);

    const handleFollowRequestSent = (otherUserID) => {
        setFollowRequestsSent([...followRequestsSent, otherUserID]);
    };

    if (loadingUserIDs || loadingUser) {
        return <p>Loading...</p>;
    }

    return (
        <div>
            <h2>Connect</h2>
            <label>Search for a user by his/her userID</label>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
            />
            <DisplayArray array={listOfPossibleMatches} displayObjectFunc={c =>
                <DisplayUserForConnect
                    otherUserID={c}
                    userOwnID={userOwnID}
                    following={following}
                    followRequestsSent={followRequestsSent}
                    onFollowRequestSent={handleFollowRequestSent} 
                /> } 
            />
        </div>
    );
}

export default Connect;