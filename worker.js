worker.onmessage = e => {
    console.log(4)
    worker.pushMessage('ke')
}
