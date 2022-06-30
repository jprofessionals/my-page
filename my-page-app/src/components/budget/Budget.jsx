import React from "react";
import { useState } from "react";
import { useEffect } from "react";
import { PostClass } from "./PostClass";
import {Col, Row } from "react-bootstrap";

const Budget = (props) => {
    const postList = props.budget.posts
    const [posts, setPosts] = useState([])


useEffect(() => {
    const updatedPosts = [...posts];
    for (let i = 0; i < postList.length; i++) {
        const post = new PostClass(
          postList[i].date,
          postList[i].description,
          postList[i].amount,
          postList[i].expense
        );
    updatedPosts[i] = post;
      setPosts(updatedPosts);
}}, [postList])

return (
    <div>
    {posts.map((post) => (
        <Row key={post.description}>
            <Col><b>Beskrivelse:</b> {post.description}</Col>
            <Col><b>Pris:</b> {post.amount}</Col> 
            <Col><b>Dato:</b> {post.date}</Col> 
        </Row>
                    
))}
</div>
);

};

export default Budget;
