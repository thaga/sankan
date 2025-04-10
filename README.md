参加型配信などで参加者の追加退出の管理に使えることを目指した小さなツールです。
ローカルのブラウザ上で動作します。
動作確認はChromeのみです。

# とりあえずのデモ
→ <https://thaga.github.io/sankan/sankan.html>  
（以下↓の使い方の3.以降を操作してみてください）

# とりあえずの使い方
1. <https://github.com/thaga/sankan> の緑色の[<> Code v]のボタンから、Download ZIPでまとめてファイルを取得する
2. sankan.html をブラウザで開く
3. 友達リストの中に表示されている[待機追加]列の、[通常]や[優先]ボタンを適当に押してみる
4. 参加待機リストの中にある、カウント列の[+][-]ボタンを押してみる、優先列の空白または〇をクリックしてみる
5. [参加者のカウントを1減らす]ボタンや、[カウントが0以下の参加待機者を削除]ボタンを押してみる
6. [つい1っち]とか[ゲ1ーマー4]とか書いてあるセルをクリックして内容を変更してみる
7. [twitch名]とか[ゲーム1内の名前]とか書いてあるセルをクリックして内容を変更してみる
8. あとはなんとなくで分かってください！

# 友達リストの操作
* [待機追加]列のボタンを押すと、その行の人が参加待機リストに送られます
* [移動]列の[≡]をマウスをマウスで上下にドラッグすると行の順番を移動することができます（実は行の空いてるとこならどこでもドラッグできます）
* [移動]列と[削除]列の間にある列は、読み込んだCSVファイルの中身になっています
* 列名の右にある<>ボタンを押すと、列の順番を入れ替えることができます
* 1行目の項目はクリックすると内容を編集できます
* それぞれの友達の各項目もクリックすると編集できます
* [削除]列のボタンを押すと、警告なしで友達が削除されます！ご注意を
* 下の方に新しい行や列を追加したり、列を削除するボタンも並んでいますので適当に試してみましょう
* 友達リストがめちゃくちゃになってしまっても、保存操作をしなければ大丈夫です

# 友達リストから参加待機リストへの追加操作
* 友達リストの[待機追加]列にある[通常]または[優先]ボタンを押すと、その行の友達を参加待機リストに追加することができます
* 友達リストの行をドラッグして参加待機リストへドラッグすることで、参加待機リストの自由な位置に追加することができます

# 参加待機リストの操作
* 「常時参加数」の数は、主催者などの交代をしない人の数です（この数の分だけリストの先頭が水色に塗られます）
* 「ゲスト参加数」の数は、ゲームなどに参加できる人数を設定しておくと便利です（この数の分だけリストが黄色く塗られます）
* 「追加時付与カウント」は、友達リストから[通常]や[優先]ボタンで追加された行に設定されるカウントです
* 「表示属性数」は、友達リストに表示されている属性のうち先頭のいくつを参加待機リストに表示するかを設定します
* [移動]列の[≡]をマウスをマウスで上下にドラッグすると行の順番を移動することができます（実は行の空いてるとこならどこでもドラッグできます）
* [カウント]列のボタンで、個別にカウントを調整することもできます
* [削除]列のボタンを押すと、参加待機リストから消すことができます
* [参加者のカウントを1減らす]ボタンを押すと、参加待機リストの黄色く塗られた範囲のカウントが1減ります
* [カウントが0以下の参加待機者を削除]ボタンを押すと、カウントが0以下の行が全部消えます

# 保存の操作
* [名前を付けて名簿を保存]あるいは[上書き保存]を押すと、友達リストの現在の状態がCSVファイルに保存されます
* 自動セーブのチェックボックスが付いていると、友達リストを何か操作するたびに勝手にCSVファイルに保存されます（ちょっと危険かも！）

# 読み込ませるCSVファイルについて
* 文字コードはUTF-8である必要があります
* 改行コードはLFでもCRLFでもかまいません（ただしセーブされるCSVファイルはLFになります）
* 全ての行の列数が同じである必要があります
* 1行目は列名を書いてある必要があります
* 1行目は空文字列を含んではいけません、また重複する列名を含んではいけません
* 2行目以降の内容は自由です
* 基本的には単なるCSVファイルなので内容は自由ですが、各行には一人ずつの情報を、各列にはサービスやゲームごとの名前などを書き込むことを想定しています

# カスタマイズ
sankan.jsの先頭付近にある変数の初期値を変更することで、いくつかの動作が変更できます
* auto_save_enabled = 自動セーブ(true:有効 / false:無効)
* ptable_regular_num = 常時参加の数
* ptable_guest_num = ゲスト参加の数
* on_add_count = 追加時付与カウント
* display_attr_count = 表示属性数
* create_sample_data = 起動時にサンプルデータを作るかどうか(true:作る / false:作らない)


以上
