import {functions} from '../firebaseConf'
import { httpsCallable } from 'firebase/functions';
import { useState } from 'react';

function DisplayRequest ({otherUserID, userOwnID}) {
    const answerFollowRequest = httpsCallable(functions, 'answerFollowRequest');
    const [requestIsBeingProcessed, setRequestIsBeingProcessed] = useState(false); 
    const [requestHasBeenProcessed, setRequestHasBeenProcessed] = useState(false);
    const [requestAccepted, setRequestAccepted] = useState(false);

    const handleAcceptOrReject = async (accept) => {
        setRequestIsBeingProcessed(true);
        setRequestAccepted(accept);
        const result = await answerFollowRequest({ followerUserID: otherUserID, followedUserID: userOwnID, accept: accept });
        console.log(result.data.result);
        setRequestHasBeenProcessed(true);   
        setRequestIsBeingProcessed(false);
    }

    if (requestIsBeingProcessed) {
        return (
            <div>
                <p>Request from {otherUserID} is being processed...</p>
            </div>
        );
    }

    if (requestHasBeenProcessed) {
        if (requestAccepted) {
            return (
                <div>
                    <p>Request from {otherUserID} has been accepted!!</p>
                </div>
            );
        } else {
            return (
                <div>
                    <p>Request from {otherUserID} has been rejected!!</p>
                </div>
            );
        }
    }

    return (
        <div>
            <p>{otherUserID}</p>
            <button onClick={() => handleAcceptOrReject(true)}>Accept</button>
            <button onClick={() => handleAcceptOrReject(false)}>Reject</button>
        </div>
    );
}

export default DisplayRequest;