# NOTE:
Before I sent this input (to Claude using Opus 4.8 model on 'high' effort), I queried the session for how it would typically handle "streaming" the agent responses (since that was a requirement), instead of waiting for the entire response, which is how I would normally do it. I did that because I never did "streaming" responses and I wasn't sure if it was a built-in feature (because that isn't something that would be possible otherwise), and turns out it is a feature - you just pass the input prompt to the JSON payload with a { 'stream': true }property, for most of the agent's, I think - at least that's what it said, and what it sort of designed before I then began the full implementation with the following input prompt.

Normally this prompt design would be a lot cleaner or more thorough, but we were really pressed for time for that entire tests, and I basically spent the entire time typing the following as fast as I could.

Also note that the there main agent providers (Claude, ChatGPT, Gemini) all require an API key to be used, but it will fallback to the local/mock system which works too.

# INPUT PROMPT:
--------------------------------------------------------------------------------

Use your 'streaming' agent design to integrate into the following backend design:

# BACKEND BUILD:
Create the follow backend api using NestJS, using SOLID principles.
Create shared utilities in order to share typescript code beteen the client and backend.
We will will create the client next.
The client should use an mini 'SDK' module that mirrors the backend API.

Backend NestJS API Requirements:

We need a module and a manager system which can take "chatbot" requests, and a given "session history" (ie. switch the session or context as needed, similar to changing tabs, identified by some unique ID), and then supply the entire context to a given chat provider (including history if loading new), and then answer questions based on the given context and data we have for the session and users (ie. product database).

The manager should handle directing the requests to the appropriate providers, and with the given session history, to "initialize" or "restore" a conversation, and then be able to field any questions related to it.

We will also have a "knowledge base" of data (as miscellaneous documents, pdfs, markdown files, and json), in different unique "sets", ie. as library groups of documents, that should be read and transcribed into session "data" in order to be answer the questions regarding them. The requests will provider a 'knowledge base id' to target the group or "library" of documents that should be used (read in, parsed, loaded into memory), in order to answer questions about that specfic subset of documents (by their knowledge base id).
For now we will group these knowledge base "groups" by some json configuration, for each subset of information. There should be JSON index of the groups of documents, ie. which "knowledge base" they belong to, with a unique ID for the group, and their name taken from their folder name. This can just be an arra      y of the documents relatd to a given group, for now, where we can add or remove documents to multiple "knowledge base" groups. These groups should be given names, to be exposed in the API for the frontend users to select from, so ensure the JSON structure can include the basic group metadata, as well as the array of documents (possibly as their own objects to be able to show them by name, etc, and maybe some other info, later, but also include their strict path of the document, which the RAG system should use to load in when they are requested).
We will expose each "group" of documents in the UI, in order to specify which "knowledge base" we are working with.
These groups should be loaded at runtime in the backend, and a backend endpoint should be created to retrieve them.

Later we weill have a means to manage these documents from a UI (add or remove them, etc), but for now whenever the api/backend loads, or any new documents are added to the system, it should check the ensure it has a "parsed" ingestion of the entire knowledge base for its session usage, or otherwise parse, transcribe, and "load" any new documents into it, from the given folder they are in, and "add" them to that knowledge base, before proceeding with fielding questions related to them. If you have a better idea of how to manage that kind of knowledge base data then feel free to do it more properly. You are allowed to use other libraries to "parse and process" the documents into a "knowledge base" format (ie. graph data or something more easily indexed), if that helps, to be able to handle a larger number of documents, but otherwise you can just load it into the system and session as they are, parsed. this should be done through a 'RAG' system, that we can load in and use before calling the agents to supply the answers to questions based on the target knowledge base.

Create an "API Key" that can be used in the client browser, targetting the static backend for now (it can verify/validate the api key added to each request).

Our backend needs to support SSE or Websockets in order to process the input requests, and output responses, as streams.
All question and answer communication should be sent backend IMMEDIATELY, ie. not waiting for the full response from the agents, but instead streamed token by token, as we will aggregate the statistics for each requests and store in our database. The websocket or SSE system should use a transport-agnostic interface, and forward all of the requests to the internal layers/managers/services to handle them, regardless of the transport. A generic "command" and messaging interface should be designed to handle the requests.
We should try to just rely on the native websocket communication to handle communication between client and server, without holding the server up.

Each request should include the API key that should be validated in the backend.

If the chatbot is asked a question, and after the documents/knowledge base are loaded, it should try to answer the questions based on the data and files in the knowledge base, as accurately as possible, but it should not try to guess. If it cannot answer a question, it should say so clearly that it does not have an answer for it.

All requests need to track input tokens, and output tokens, and estimated cost, for all questions and agent usage. This needs to be documented and stored within the system, so we can keep track of the totals for each user, session, and in general the entire system. The requests and token usage should be stored for the:
	- current user
	- current provider
	- input token cost (during processing)
	- output token cost (after and while processing is occurring)
	- the total runtime of the question
	- the total estimated cost of the question (based on the providers rate and current token usage for the question)

- implement a configuration (can be static) to configure different chatbot backend providers when the API starts:
	- Claude
	- OpenAI GPI
	- Gemini
* Each provider should store its estimated cost per token, so we can forward this to the user while th questions are being answered, showing an "estimated cost" for their questions, and their entire history as well up until that point.
* Expose the providers and their statuses in a unqiue API endpoint that we can use to populate the client application in a dropdown for selection.
* The user will be able to supply which chatbot provider they want to use when asking questions.
* When the user switches models, it should "load" the current full conversation history to the new model/provider, so all history for any given "session" should be stored, preserved.
* If a provider is not available (ie. not configured correctly, API is down, or the user is out of token usage), it should automatically switch to the next provider.
* During processing of a question, if the token usage is over 75% for the current session, for that provider, the user will be warned. If it hits 90%, the user will be warned more severely (ie. red). This will be a client-side operation/check, but the backend should supply the current and correct token usage percentage for the current model and provider's context.
* The entire session history should be stored in memory, and in the database, or each session (separate from provider, but each question can be marked as which provider is answering it, in case they change providers during the session, but the session history should remain the same).
* There should be an operation to export this entire history, for a given session/ID, exported as either a CSV or JSON format (selectable but JSON as a primary).

* The main backend api method for these chat session operations will be a POST to /chat endpoint, which will include:
	- the model to use (from above, claude, chatgpt, and gemini)
	- the messages as the input (in an array, to support multiple messages in a linear sequential stream)
	- the systemPrompt to start the session with (we can leave this as configurable in the API, but it should fallback to a default systemPrompt in our system, configurable in a static file for now).
	- the knowledgeBaseId (a specific ID to target a specific set of documents)

* All requests should try to be done through SSE or Websockets, as explained above, streaming the tokens as they arrive back to the client. Te responses to the input questions should have the following format:
	- { inputTokens, outputTokens, cost, model, latencyMs, sourceChunks }

* Any errors related to rate limiting, authentication, or model unavailability should be handled gracefully:
	- surface the errors to the client web app for the user to see, at least as toast notifications.
	- if a model is unavailable, automatically fall back to a different model that is avaiable, including the entire history and current knowlede base id.
	- if it hits a rate limit, ask the user if they want to wait, or switch to a different model

* Put all "static configuration" in a JSON configuration file that we can both edit, and read into the backend at runtime.



# CLIENT REQUIREMENTS:
Then, create a client web application that will match this backend, and work with it, to expose a 'chatbot' interface, with the following requirements:
- use React with SASS and SOLID programming principles, create re-usable components.
- Create an interface to start new "sessions" that target a given "knowledge base" from the above knowledge base endpoint, that can be used to answer the questions.
* When a new session begins with a given knowledge base ID, show the new interface to enter "chats" (questions) related to to it, with a module/component widget to show the current session token usage (input vs output), as totals, and for the next or pending/current request, and any status updated for the input Q&A process here (ie. session usage warnings at 75% in orange, and in red at 90%, for the current session, based on the output responses).
* Their should be a separate module "SDK" that can be loaded on this page (in the entire app) to speak with the given backend endpoints above, and can handle all errors and relay them to the current session. It should include a manager to be able to initiate the websocket or SSE communcation (commands/messages, and routing them to a given session), to be able to manage the resposes, and forward them to the drawing utilities for a given session's state, that should then show in that session window.
* The session should include a custom dropdown component in the upper right to select which model the user wants to use (ie. from the above endpoint of available models, and their statuses). If a model is not available it should show as grey in this dropdown.
* There can also be another custom dropdown in the upper left, to change the current Knowledge base (based in folder name + id, etc). And which the user can essentially use to change their Question target for which data it wants an answer to. The current selected knowledge base id should be sent with all requests to the backend websocket or SSE communication.
* When the application loads, show the user a minimal UI to select



# BACKEND DATA / KNOWLEDGE BASE SETUP:
To begin, first we need to develop some same knowledge bases to work with.
Come up with a few different knowledge bases for a company to use to answer questions about its products. The documents should be a mix of markdown, PDFs, and JSON, and include general product-related data (ie. pricing and offerings), as well as technical documentation.
Maybe it would be best to separate the knowlede bases based on product-related general questions, vs technical questions, etc.

Some of the sample questions which we need to handle will be:
- What are the key differences between our Pro and Enterprise pricing tiers?
- Does Product integrate with Salesforce? What version is required?
- What new featureds were released in v4.2 of the Analyics module?
- Our client is getting a 403 error on the API - what should I check first?
- Which products support SSO via SAML 2.0?
- What is the SLA for Priority 1 support tickets?

The different users of the system will be such as:
- Sales Executive (needs quick answers on product pricing, feature comparisons, and compatibility during custom calls)
- Support Engineer (Needs detailed technical specs, integration guides, and troubleshooting steps without reading 80-page PDFs)
- Product Trainer (needs to onboard new hired quickly using accurate, up-to-date product knowledge without manually updating training decks).

Design the system and sample knowledge base documents to help demo a system for the above type of users.



Build out all systems fully, as best as you can, with the above requirements for all.
You can spawn different subagents if you need to.
