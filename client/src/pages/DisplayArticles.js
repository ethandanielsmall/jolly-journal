import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';

import {
    Container,
    Col,
    Form,
    Button,
    Card,
    Row
} from 'react-bootstrap';

import Auth from '../utils/auth';
import  fetchNews from '../utils/API';
import { saveArticleIds, getSavedArticleIds } from '../utils/localStorage';
import { SAVE_ARTICLE } from '../utils/mutations';


const DisplayArticles = () => {
    console.log("DisplayArticles is running");
    // state for holding returned news api data
    const [newsArticles, setnewsArticles] = useState([]);

    // state to hold saved articleId values
    const [savedArticleIds, setsavedArticleIds] = useState(getSavedArticleIds());

    // useEffect hook to save `savedArticleIds` list to localStorage on component unmount
    useEffect(() => {
        return () => saveArticleIds(savedArticleIds);
    });

    const [saveArticle] = useMutation(SAVE_ARTICLE);

    // method to search for articles and set state on form submit
    const displayNews = async (event) => {
        event.preventDefault();

    try {
        const response = await fetchNews();

        if (!response.ok) {
            throw new Error('something went wrong!');
        }

        const { items } = await response.json();
        console.log("items is ", items);

        const newsData = items.map((news) => ({
            articleId: news.id,
            title: news.title,
            description: news.description,
            image: news.image?.thumbnail || '',
            link: news.link || '',
        }));
        // setnewsArticles will update newsArticles with a list of all retreived articles 
        setnewsArticles(newsData);
    } catch (err) {
        console.error(err);
    }
    };
    displayNews();


    // create function to handle saving a book to our database
    const handlesaveArticle = async (articleId) => {
        // find the article in `newsArticles` state by the matching id
        const articleToSave = newsArticles.find((article) => article.articleId === articleId);
        console.log("articleToSave is ", articleToSave);
        // get token
        const token = Auth.loggedIn() ? Auth.getToken() : null;
        console.log("token is ", token);
        if (!token) {
            return false;
        }

        try {
            // Execute the saveArticle mutation
            const { data } = await saveArticle({ variables: { newsData: { ...articleToSave } } });
            console.log("data is ", data);
            // if article successfully saves to user's account, save article id to state
            setsavedArticleIds([...savedArticleIds, articleToSave.articleId]);
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <>
            <div className="text-light bg-dark p-5">
                <Container>
                    <h1>Latest News</h1>
                </Container>
            </div>

            <Container>
                <h2 className='pt-5'>
                    {newsArticles.length
                        ? `Viewing ${newsArticles.length} results:`
                        : 'Search for a book to begin'}
                </h2>
                <Row>
                    {newsArticles.map((news) => {
                        return (
                            <Col md="4" key={news.articleId}>
                                <Card key={news.articleId} border='dark'>
                                    {news.image ? (
                                        <Card.Img src={news.image} alt={`The cover for ${news.title}`} variant='top' />
                                    ) : null}
                                    <Card.Body>
                                        <Card.Title>{news.title}</Card.Title>
                                        <Card.Text>{news.description}</Card.Text>
                                        {Auth.loggedIn() && (
                                            <Button
                                                disabled={savedArticleIds?.some((savedArticleId) => savedArticleId === news.articleId)}
                                                className='btn-block btn-info'
                                                onClick={() => handlesaveArticle(news.articleId)}>
                                                {savedArticleIds?.some((savedArticleId) => savedArticleId === news.articleId)
                                                    ? 'This article has already been saved!'
                                                    : 'Save this Article!'}
                                            </Button>
                                        )}
                                    </Card.Body>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
            </Container>
        </>
    );
};

export default DisplayArticles;