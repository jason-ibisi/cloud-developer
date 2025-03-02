import { Router, Request, Response } from 'express';
import { FeedItem } from '../models/FeedItem';
import { requireAuth } from '../../users/routes/auth.router';
import * as AWS from '../../../../aws';

const router: Router = Router();

// Get all feed items
router.get('/', async (req: Request, res: Response) => {
  await FeedItem.findAndCountAll({ order: [['id', 'DESC']] })
    .then((items) => {
      items.rows.map((item) => {
        if (item.url) {
          item.url = AWS.getGetSignedUrl(item.url);
        }
      });

      res.send(items);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

// @TODO
// Add an endpoint to GET a specific resource by Primary Key
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  if (id) {
    await FeedItem.findByPk(id)
      .then((data) => {
        if (!data) {
          res.status(404).send({ message: 'no feed found' });
        }

        data.url = AWS.getGetSignedUrl(data.url);
        res.status(200).send(data);
      })
      .catch((error) => {
        res.status(500).send(error);
      });
  }

  res.status(400).send({ message: 'id is required' });
});

// update a specific resource
router.patch('/:id', requireAuth, async (req: Request, res: Response) => {
  // @TODO try it yourself
  const { id } = req.params;
  const { caption, url } = req.body;

  if (id) {
    const feedItem = {
      url: url,
      caption: caption,
    };

    await FeedItem.update(feedItem, { where: { id: id } }).then((data) => {
      res.status(200).json({
        message: 'Feed updated successfully.',
        item: data,
      });
    });
  }

  res.status(500).send('not implemented');
});

// Get a signed url to put a new item in the bucket
router.get(
  '/signed-url/:fileName',
  requireAuth,
  async (req: Request, res: Response) => {
    const { fileName } = req.params;
    const url = AWS.getPutSignedUrl(fileName);
    res.status(201).send({ url: url });
  }
);

// Post meta data and the filename after a file is uploaded
// NOTE the file name is they key name in the s3 bucket.
// body : {caption: string, fileName: string};
router.post('/', requireAuth, async (req: Request, res: Response) => {
  const caption = req.body.caption;
  const fileName = req.body.url;

  // check Caption is valid
  if (!caption) {
    return res
      .status(400)
      .send({ message: 'Caption is required or malformed' });
  }

  // check Filename is valid
  if (!fileName) {
    return res.status(400).send({ message: 'File url is required' });
  }

  const item = await new FeedItem({
    caption: caption,
    url: fileName,
  });

  const saved_item = await item.save();

  saved_item.url = AWS.getGetSignedUrl(saved_item.url);
  res.status(201).send(saved_item);
});

export const FeedRouter: Router = router;
